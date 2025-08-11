const db = require('./database');
const paymentValidator = require('./services/paymentValidator');

async function diagnoseValidation() {
    console.log('🔍 Diagnóstico de validación de pagos');
    console.log('═══════════════════════════════════════════════════════════════');
    
    try {
        // 1. Verificar usuarios
        console.log('\n👤 Verificando usuarios...');
        const users = await new Promise((resolve, reject) => {
            db.all('SELECT id, username, email FROM users', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (users.length === 0) {
            console.log('⚠️  No hay usuarios registrados');
            console.log('💡 Necesitas registrarte primero en http://localhost:3002');
            return;
        }
        
        console.log(`✅ ${users.length} usuario(s) encontrado(s):`);
        users.forEach(user => console.log(`   - ${user.username} (${user.email})`));
        
        // 2. Verificar estados de cuenta
        console.log('\n📄 Verificando estados de cuenta...');
        const statements = await new Promise((resolve, reject) => {
            db.all('SELECT id, user_id, filename, file_type FROM account_statements', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (statements.length === 0) {
            console.log('⚠️  No hay estados de cuenta subidos');
            console.log('💡 Necesitas subir un estado de cuenta (Excel/PDF) primero');
            return;
        }
        
        console.log(`✅ ${statements.length} estado(s) de cuenta encontrado(s):`);
        statements.forEach(stmt => console.log(`   - ${stmt.filename} (${stmt.file_type})`));
        
        // 3. Verificar transacciones
        console.log('\n💰 Verificando transacciones...');
        const transactions = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM statement_transactions LIMIT 10', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        if (transactions.length === 0) {
            console.log('⚠️  No hay transacciones procesadas');
            console.log('💡 El estado de cuenta debe contener transacciones válidas');
            return;
        }
        
        console.log(`✅ ${transactions.length} transacciones encontradas (mostrando primeras 10):`);
        transactions.forEach(tx => {
            console.log(`   - ${tx.date} | $${tx.amount} | ${tx.description || 'Sin descripción'} | Ref: ${tx.reference_number || 'N/A'}`);
        });
        
        // 4. Simular validación con datos de prueba
        console.log('\n🧪 Probando validación con datos de ejemplo...');
        
        // Datos simulados del OCR
        const testData = {
            amount: 789,
            date: '14/07/2025',
            reference: '123456789',
            description: 'Pago de prueba',
            bankName: 'BBVA PROVINCIAL',
            accountNumber: null
        };
        
        console.log('📊 Datos de prueba:', testData);
        
        // Usar el primer estado de cuenta para validar
        const statementId = statements[0].id;
        console.log(`🔍 Validando contra estado de cuenta ID: ${statementId}`);
        
        const validationResult = await paymentValidator.validatePayment(testData, statementId);
        
        console.log('\n📊 RESULTADO DE VALIDACIÓN:');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('✅ Válido:', validationResult.isValid);
        console.log('🎯 Confianza:', (validationResult.confidence * 100).toFixed(1) + '%');
        console.log('🔍 Coincidencias encontradas:', validationResult.matches.length);
        
        if (validationResult.errors.length > 0) {
            console.log('\n❌ Errores:');
            validationResult.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (validationResult.matches.length > 0) {
            console.log('\n✅ Mejores coincidencias:');
            validationResult.matches.slice(0, 3).forEach((match, i) => {
                console.log(`   ${i + 1}. Confianza: ${(match.confidence * 100).toFixed(1)}%`);
                console.log(`      Monto: $${match.transaction.amount}`);
                console.log(`      Fecha: ${match.transaction.date}`);
                console.log(`      Descripción: ${match.transaction.description || 'N/A'}`);
                console.log(`      Referencia: ${match.transaction.reference_number || 'N/A'}`);
                console.log('');
            });
        }
        
        // 5. Sugerencias de mejora
        console.log('\n💡 SUGERENCIAS PARA MEJORAR LA VALIDACIÓN:');
        console.log('═══════════════════════════════════════════════════════════════');
        
        if (validationResult.confidence < 0.7) {
            console.log('🔧 Para mejorar la confianza:');
            console.log('   1. Asegúrate de que el monto del OCR coincida con una transacción');
            console.log('   2. Verifica que las fechas estén en el rango correcto');
            console.log('   3. Incluye números de referencia en las transacciones');
            console.log('   4. Mejora la descripción de las transacciones');
        }
        
        // 6. Crear transacción de prueba
        console.log('\n🔧 ¿Quieres crear una transacción de prueba para validar?');
        console.log('Ejecuta este comando en tu base de datos:');
        console.log(`INSERT INTO statement_transactions (statement_id, date, description, amount, reference_number) 
VALUES (${statementId}, '14/07/2025', 'Pago de prueba', 789.00, '123456789');`);
        
        console.log('\n🎯 Después de agregar la transacción, la validación debería tener mayor confianza.');
        
    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
    }
}

diagnoseValidation().then(() => {
    console.log('\n🏁 Diagnóstico completado');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
