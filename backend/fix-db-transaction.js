const db = require('./database');

async function fixDbTransaction() {
    console.log('🔧 Corrigiendo la transacción de prueba en la base de datos...');
    
    try {
        // 1. Borrar transacciones de prueba antiguas para evitar conflictos
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM statement_transactions', function(err) {
                if (err) reject(err);
                console.log(`🗑️ Se eliminaron ${this.changes} transacciones antiguas.`);
                resolve();
            });
        });

        // 2. Obtener TODOS los estados de cuenta
        const statements = await new Promise((resolve, reject) => {
            db.all('SELECT id FROM account_statements', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (statements.length === 0) {
            console.log('❌ No se encontraron estados de cuenta. No se puede agregar la transacción.');
            return;
        }

        console.log(`ℹ️ Se encontraron ${statements.length} estados de cuenta. Agregando la transacción de prueba a cada uno.`);

        // 3. Insertar la transacción de prueba para CADA estado de cuenta
        for (const statement of statements) {
            const statementId = statement.id;
            const correctTransaction = {
                statement_id: statementId,
                date: '01/08/2025',
                description: 'Pago de prueba corregido',
                amount: 21070.56,
                reference_number: '003351656857'
            };

            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO statement_transactions (statement_id, date, description, amount, reference_number) VALUES (?, ?, ?, ?, ?)',
                    [
                        correctTransaction.statement_id, 
                        correctTransaction.date, 
                        correctTransaction.description, 
                        correctTransaction.amount, 
                        correctTransaction.reference_number
                    ],
                    function(err) {
                        if (err) reject(err);
                        else {
                            console.log(`✅ Se insertó la transacción para el estado de cuenta ID ${statementId} (Nuevo ID de transacción: ${this.lastID})`);
                            resolve(this.lastID);
                        }
                    }
                );
            });
        }

        console.log('\n🎯 Base de datos corregida. La transacción de prueba ahora tiene los datos correctos.');

    } catch (error) {
        console.error('❌ Error corrigiendo la base de datos:', error);
    }
}

fixDbTransaction().then(() => {
    console.log('\n🏁 Proceso de corrección completado.');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error fatal en el script de corrección:', error);
    process.exit(1);
});
