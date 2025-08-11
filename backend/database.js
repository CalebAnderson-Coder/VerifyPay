const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'verifypay.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

// Crear tablas
db.serialize(() => {
    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de estados de cuenta
    db.run(`CREATE TABLE IF NOT EXISTS account_statements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Tabla de transacciones del estado de cuenta
    db.run(`CREATE TABLE IF NOT EXISTS statement_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        statement_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        balance REAL,
        transaction_type TEXT,
        reference_number TEXT,
        FOREIGN KEY (statement_id) REFERENCES account_statements (id)
    )`);

    // Tabla de verificaciones de pago
    db.run(`CREATE TABLE IF NOT EXISTS payment_verifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        statement_id INTEGER NOT NULL,
        payment_image_path TEXT NOT NULL,
        extracted_data TEXT,
        verification_result TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (statement_id) REFERENCES account_statements (id)
    )`);

    // Tabla de movimientos extraídos de imágenes
    db.run(`CREATE TABLE IF NOT EXISTS extracted_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        verification_id INTEGER NOT NULL,
        date TEXT,
        amount REAL,
        description TEXT,
        reference_number TEXT,
        bank_name TEXT,
        account_number TEXT,
        FOREIGN KEY (verification_id) REFERENCES payment_verifications (id)
    )`);
});

module.exports = db;
