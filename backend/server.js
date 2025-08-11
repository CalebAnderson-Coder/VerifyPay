const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const db = require('./database');
const ocrService = require('./services/ocrService');
const fileProcessor = require('./services/fileProcessor');
const paymentValidator = require('./services/paymentValidator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*' // Permitir cualquier origen para el despliegue
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crear directorios si no existen
const uploadsDir = path.join(__dirname, 'uploads');
const statementsDir = path.join(uploadsDir, 'statements');
const paymentsDir = path.join(uploadsDir, 'payments');

[uploadsDir, statementsDir, paymentsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = req.path.includes('statement') ? statementsDir : paymentsDir;
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueId = uuidv4();
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueId}${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        console.log(`[Multer File Filter] Mimetype recibido: ${file.mimetype}`);
        const allowedTypes = [
            'image/jpeg', 
            'image/png', 
            'image/jpg', 
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
            'application/vnd.ms-excel',
            'text/csv' // Añadido para soportar CSV
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            console.log('[Multer File Filter] Tipo de archivo aceptado.');
            cb(null, true);
        } else {
            console.log('[Multer File Filter] Tipo de archivo RECHAZADO.');
            // Devolvemos un error específico que el frontend pueda interpretar
            cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Tipo de archivo no soportado'));
        }
    }
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Verificar si el usuario ya existe
        db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Error en la base de datos' });
            }
            
            if (user) {
                return res.status(400).json({ error: 'El usuario ya existe' });
            }

            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Crear nuevo usuario
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', 
                [username, email, hashedPassword], function(err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error al crear usuario' });
                    }
                    
                    const token = jwt.sign({ id: this.lastID, username }, process.env.JWT_SECRET || 'secret_key');
                    res.json({ token, user: { id: this.lastID, username, email } });
                });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Error en la base de datos' });
            }
            
            if (!user) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret_key');
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Rutas para estados de cuenta
app.post('/api/upload-statement', authenticateToken, upload.single('statement'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ningún archivo' });
        }

        const { filename, path: filePath, mimetype } = req.file;
        const userId = req.user.id;

        // Guardar información del archivo en la base de datos
        db.run('INSERT INTO account_statements (user_id, filename, file_path, file_type) VALUES (?, ?, ?, ?)',
            [userId, filename, filePath, mimetype], async function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al guardar el archivo' });
                }

                const statementId = this.lastID;

                // Procesar el archivo para extraer transacciones
                try {
                    const transactions = await fileProcessor.processStatementFile(filePath, mimetype);
                    
                    // Guardar transacciones en la base de datos
                    const stmt = db.prepare('INSERT INTO statement_transactions (statement_id, date, description, amount, balance, transaction_type, reference_number) VALUES (?, ?, ?, ?, ?, ?, ?)');
                    
                    transactions.forEach(transaction => {
                        stmt.run([statementId, transaction.date, transaction.description, transaction.amount, transaction.balance, transaction.type, transaction.reference]);
                    });
                    
                    stmt.finalize();

                    res.json({ 
                        message: 'Estado de cuenta subido y procesado exitosamente',
                        statementId: statementId,
                        transactionsCount: transactions.length,
                        transactions: transactions // Devolver las transacciones extraídas
                    });
                } catch (processingError) {
                    console.error('Error procesando archivo:', processingError);
                    res.json({ 
                        message: 'Archivo subido pero no se pudo procesar automáticamente',
                        statementId: statementId
                    });
                }
            });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/statements', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.all('SELECT * FROM account_statements WHERE user_id = ? ORDER BY upload_date DESC', [userId], (err, statements) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener estados de cuenta' });
        }
        res.json(statements);
    });
});

app.get('/api/statements/:id/transactions', authenticateToken, (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Primero, verificar que el estado de cuenta pertenece al usuario
    db.get('SELECT * FROM account_statements WHERE id = ? AND user_id = ?', [id, userId], (err, statement) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        if (!statement) {
            return res.status(404).json({ error: 'Estado de cuenta no encontrado o no autorizado' });
        }

        // Si se encuentra, obtener las transacciones
        db.all('SELECT * FROM statement_transactions WHERE statement_id = ?', [id], (err, transactions) => {
            if (err) {
                return res.status(500).json({ error: 'Error al obtener las transacciones' });
            }
            res.json(transactions);
        });
    });
});

// Rutas para verificación de pagos
app.post('/api/verify-payment', authenticateToken, upload.single('payment'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ninguna imagen de pago' });
        }

        const { statementId } = req.body;
        const userId = req.user.id;
        const { path: imagePath } = req.file;

        // Crear registro de verificación
        db.run('INSERT INTO payment_verifications (user_id, statement_id, payment_image_path) VALUES (?, ?, ?)',
            [userId, statementId, imagePath], async function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Error al crear verificación' });
                }

                const verificationId = this.lastID;

                try {
                    // Extraer datos de la imagen usando OCR
                    const extractedData = await ocrService.extractPaymentData(imagePath);
                    
                    // Validar contra el estado de cuenta
                    const validationResult = await paymentValidator.validatePayment(extractedData, statementId);
                    
                    // Actualizar verificación con resultados
                    db.run('UPDATE payment_verifications SET extracted_data = ?, verification_result = ?, status = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
                        [JSON.stringify(extractedData), JSON.stringify(validationResult), validationResult.isValid ? 'verified' : 'rejected', verificationId]);

                    // Preparar respuesta con datos de comparación
                    const response = {
                        verificationId: verificationId,
                        extractedData: extractedData,
                        validationResult: validationResult,
                        comparison: {
                            ocr: {
                                amount: extractedData.amount,
                                date: extractedData.date,
                                reference: extractedData.reference,
                                description: extractedData.description,
                                bankName: extractedData.bankName,
                                accountNumber: extractedData.accountNumber
                            },
                            statement: null,
                            matches: []
                        }
                    };

                    // Agregar datos de la transacción encontrada si existe
                    if (validationResult.matches && validationResult.matches.length > 0) {
                        const bestMatch = validationResult.matches[0];
                        response.comparison.statement = {
                            amount: bestMatch.transaction.amount,
                            date: bestMatch.transaction.date,
                            reference: bestMatch.transaction.reference_number,
                            description: bestMatch.transaction.description,
                            confidence: bestMatch.confidence
                        };
                        
                        // Agregar detalles de coincidencias
                        response.comparison.matches = validationResult.matches.map(match => ({
                            confidence: match.confidence,
                            details: match.details,
                            transaction: {
                                amount: match.transaction.amount,
                                date: match.transaction.date,
                                reference: match.transaction.reference_number,
                                description: match.transaction.description
                            }
                        }));
                    }

                    res.json(response);
                } catch (processingError) {
                    console.error('Error procesando pago:', processingError);
                    db.run('UPDATE payment_verifications SET status = ? WHERE id = ?', ['error', verificationId]);
                    res.status(500).json({ error: 'Error procesando la imagen de pago' });
                }
            });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/verifications', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.all(`SELECT v.*, s.filename as statement_filename 
            FROM payment_verifications v 
            JOIN account_statements s ON v.statement_id = s.id 
            WHERE v.user_id = ? 
            ORDER BY v.created_at DESC`, [userId], (err, verifications) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener verificaciones' });
        }
        res.json(verifications);
    });
});

// Ruta para obtener estadísticas
app.get('/api/dashboard', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    const queries = [
        'SELECT COUNT(*) as total_statements FROM account_statements WHERE user_id = ?',
        'SELECT COUNT(*) as total_verifications FROM payment_verifications WHERE user_id = ?',
        'SELECT COUNT(*) as verified_payments FROM payment_verifications WHERE user_id = ? AND status = "verified"',
        'SELECT COUNT(*) as pending_payments FROM payment_verifications WHERE user_id = ? AND status = "pending"'
    ];
    
    Promise.all(queries.map(query => {
        return new Promise((resolve, reject) => {
            db.get(query, [userId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    })).then(results => {
        res.json({
            totalStatements: results[0].total_statements,
            totalVerifications: results[1].total_verifications,
            verifiedPayments: results[2].verified_payments,
            pendingPayments: results[3].pending_payments
        });
    }).catch(error => {
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    });
});

// Servir archivos estáticos
app.use('/uploads', express.static(uploadsDir));

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
