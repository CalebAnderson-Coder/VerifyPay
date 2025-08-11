const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ocrService = require('./services/ocrService');

const app = express();
const PORT = 3003;

// Configurar multer para testing
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, __dirname);
    },
    filename: (req, file, cb) => {
        cb(null, 'test-upload-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes JPG, JPEG y PNG'));
        }
    }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Página de prueba
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Prueba OCR - VerifyPay</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .container { background: #f5f5f5; padding: 20px; border-radius: 10px; }
                .result { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .error { background: #ffebee; color: #c62828; }
                .success { background: #e8f5e8; color: #2e7d32; }
                .loading { color: #1976d2; }
                button { background: #1976d2; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                button:hover { background: #1565c0; }
                button:disabled { background: #ccc; cursor: not-allowed; }
                input[type="file"] { margin: 10px 0; }
                pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔍 Prueba OCR - VerifyPay</h1>
                <p>Sube una imagen de comprobante de pago para probar el OCR</p>
                
                <form id="uploadForm">
                    <input type="file" id="imageFile" accept="image/*" required>
                    <button type="submit" id="submitBtn">Analizar Imagen</button>
                </form>
                
                <div id="result"></div>
            </div>
            
            <script>
                document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const fileInput = document.getElementById('imageFile');
                    const submitBtn = document.getElementById('submitBtn');
                    const resultDiv = document.getElementById('result');
                    
                    if (!fileInput.files[0]) {
                        alert('Por favor selecciona una imagen');
                        return;
                    }
                    
                    const formData = new FormData();
                    formData.append('image', fileInput.files[0]);
                    
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Analizando...';
                    resultDiv.innerHTML = '<div class="result loading">🔄 Procesando imagen con OCR...</div>';
                    
                    try {
                        const response = await fetch('/test-ocr', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        if (response.ok) {
                            let html = \`
                                <div class="result success">
                                    <h3>✅ OCR Completado</h3>
                            \`;
                            
                            // Mostrar resultado de validación
                            if (data.validationResult) {
                                const isValid = data.validationResult.isValid;
                                const confidence = (data.validationResult.confidence * 100).toFixed(1);
                                
                                html += \`
                                    <div style="background: \${isValid ? '#e8f5e8' : '#ffebee'}; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid \${isValid ? '#4caf50' : '#f44336'}">
                                        <h4>\${isValid ? '✅' : '❌'} Resultado de Validación</h4>
                                        <p><strong>Estado:</strong> \${isValid ? 'Pago Verificado' : 'Pago No Verificado'}</p>
                                        <p><strong>Confianza:</strong> \${confidence}%</p>
                                        <p><strong>Coincidencias:</strong> \${data.validationResult.matches ? data.validationResult.matches.length : 0}</p>
                                    </div>
                                \`;
                            }
                            
                            // Mostrar comparación visual si existe
                            if (data.comparison) {
                                html += \`
                                    <h4>🔍 Comparación Visual</h4>
                                    <div style="display: flex; gap: 20px; margin: 20px 0;">
                                        <div style="flex: 1; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                            <h5 style="color: #1976d2; margin-top: 0;">📱 Datos del OCR (Comprobante)</h5>
                                            <p><strong>💰 Monto:</strong> $\${data.comparison.ocr.amount || 'No detectado'}</p>
                                            <p><strong>📅 Fecha:</strong> \${data.comparison.ocr.date || 'No detectada'}</p>
                                            <p><strong>🔗 Referencia:</strong> \${data.comparison.ocr.reference || 'No detectada'}</p>
                                            <p><strong>🏦 Banco:</strong> \${data.comparison.ocr.bankName || 'No detectado'}</p>
                                            <p><strong>📄 Descripción:</strong> \${data.comparison.ocr.description || 'No detectada'}</p>
                                        </div>
                                        
                                        <div style="flex: 1; background: \${data.comparison.statement ? '#e8f5e8' : '#ffebee'}; padding: 15px; border-radius: 8px;">
                                            <h5 style="color: \${data.comparison.statement ? '#2e7d32' : '#c62828'}; margin-top: 0;">📊 Estado de Cuenta</h5>
                                            \${data.comparison.statement ? \`
                                                <p><strong>💰 Monto:</strong> $\${data.comparison.statement.amount}</p>
                                                <p><strong>📅 Fecha:</strong> \${data.comparison.statement.date}</p>
                                                <p><strong>🔗 Referencia:</strong> \${data.comparison.statement.reference || 'N/A'}</p>
                                                <p><strong>📄 Descripción:</strong> \${data.comparison.statement.description || 'N/A'}</p>
                                                <p><strong>🎯 Confianza:</strong> \${(data.comparison.statement.confidence * 100).toFixed(1)}%</p>
                                            \` : '<p>❌ No se encontró coincidencia en el estado de cuenta</p>'}
                                        </div>
                                    </div>
                                \`;
                                
                                // Mostrar todas las coincidencias si existen
                                if (data.comparison.matches && data.comparison.matches.length > 1) {
                                    html += \`
                                        <h5>📋 Otras Coincidencias Encontradas</h5>
                                        <div style="max-height: 200px; overflow-y: auto;">
                                    \`;
                                    
                                    data.comparison.matches.slice(1).forEach((match, index) => {
                                        html += \`
                                            <div style="background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 5px;">
                                                <strong>Coincidencia #\${index + 2}</strong> - Confianza: \${(match.confidence * 100).toFixed(1)}%<br>
                                                Monto: $\${match.transaction.amount} | Fecha: \${match.transaction.date} | Ref: \${match.transaction.reference || 'N/A'}
                                            </div>
                                        \`;
                                    });
                                    
                                    html += '</div>';
                                }
                            }
                            
                            // Mostrar datos extraídos originales
                            html += \`
                                <h4>📊 Datos Extraídos (Detallado)</h4>
                                <p><strong>💰 Monto:</strong> \${data.extractedData.amount || 'No detectado'}</p>
                                <p><strong>📅 Fecha:</strong> \${data.extractedData.date || 'No detectada'}</p>
                                <p><strong>🔗 Referencia:</strong> \${data.extractedData.reference || 'No detectada'}</p>
                                <p><strong>🏦 Banco:</strong> \${data.extractedData.bankName || 'No detectado'}</p>
                                <p><strong>💳 Cuenta:</strong> \${data.extractedData.accountNumber || 'No detectada'}</p>
                                <p><strong>📄 Descripción:</strong> \${data.extractedData.description || 'No detectada'}</p>
                                
                                <h4>📝 Texto Completo:</h4>
                                <pre>\${data.extractedData.rawText}</pre>
                            </div>
                            \`;
                            
                            resultDiv.innerHTML = html;
                        } else {
                            resultDiv.innerHTML = \`
                                <div class="result error">
                                    <h3>❌ Error</h3>
                                    <p>\${data.error || 'Error desconocido'}</p>
                                </div>
                            \`;
                        }
                    } catch (error) {
                        resultDiv.innerHTML = \`
                            <div class="result error">
                                <h3>❌ Error de Conexión</h3>
                                <p>\${error.message}</p>
                            </div>
                        \`;
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Analizar Imagen';
                    }
                });
            </script>
        </body>
        </html>
    `);
});

// Endpoint para testing OCR
app.post('/test-ocr', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
        }

        console.log('📁 Imagen recibida:', req.file.filename);
        console.log('🔍 Iniciando OCR...');

        // Procesar imagen con OCR
        const extractedData = await ocrService.extractPaymentData(req.file.path);

        console.log('✅ OCR completado');

        // Simular validación con estados de cuenta disponibles
        const db = require('./database');
        const paymentValidator = require('./services/paymentValidator');

        let validationResult = null;
        let comparison = null;

        try {
            // Obtener el primer estado de cuenta disponible
            const statements = await new Promise((resolve, reject) => {
                db.all('SELECT id FROM account_statements LIMIT 1', (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });

            if (statements.length > 0) {
                const statementId = statements[0].id;
                validationResult = await paymentValidator.validatePayment(extractedData, statementId);

                // Crear datos de comparación
                comparison = {
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
                };

                // Agregar datos de la transacción encontrada si existe
                if (validationResult.matches && validationResult.matches.length > 0) {
                    const bestMatch = validationResult.matches[0];
                    comparison.statement = {
                        amount: bestMatch.transaction.amount,
                        date: bestMatch.transaction.date,
                        reference: bestMatch.transaction.reference_number,
                        description: bestMatch.transaction.description,
                        confidence: bestMatch.confidence
                    };

                    comparison.matches = validationResult.matches.map(match => ({
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
            }
        } catch (validationError) {
            console.error('Error en validación:', validationError);
        }

        // Limpiar archivo temporal
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            extractedData: extractedData,
            validationResult: validationResult,
            comparison: comparison,
            message: 'OCR procesado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error en OCR:', error);
        
        // Limpiar archivo temporal si existe
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Error procesando la imagen'
        });
    }
});

// Iniciar servidor de prueba
app.listen(PORT, () => {
    console.log('🚀 Servidor de prueba OCR iniciado');
    console.log(`📱 Accede a: http://localhost:${PORT}`);
    console.log('🔍 Sube imágenes para probar el OCR');
});

module.exports = app;
