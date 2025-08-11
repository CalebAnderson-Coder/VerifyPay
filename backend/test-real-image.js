const ocrService = require('./services/ocrService');
const path = require('path');

async function testRealImage() {
    console.log('🔍 Probando OCR con imagen real...');
    
    try {
        // Ruta donde debes guardar la imagen
        const imagePath = path.join(__dirname, 'test-pagomovil.jpg');
        
        console.log('📁 Buscando imagen en:', imagePath);
        
        // Verificar si la imagen existe
        const fs = require('fs');
        if (!fs.existsSync(imagePath)) {
            console.log('❌ La imagen no existe. Por favor:');
            console.log('1. Guarda la imagen como "test-pagomovil.jpg" en:', __dirname);
            console.log('2. Ejecuta el script nuevamente');
            return;
        }
        
        console.log('✅ Imagen encontrada, iniciando OCR...');
        
        // Extraer datos de la imagen
        const extractedData = await ocrService.extractPaymentData(imagePath);
        
        console.log('\n📊 RESULTADOS DEL OCR:');
        console.log('════════════════════════════════════════');
        console.log('💰 Monto extraído:', extractedData.amount);
        console.log('📅 Fecha extraída:', extractedData.date);
        console.log('🔗 Referencia/Operación:', extractedData.reference);
        console.log('📄 Descripción:', extractedData.description);
        console.log('🏦 Banco:', extractedData.bankName);
        console.log('💳 Cuenta:', extractedData.accountNumber);
        console.log('════════════════════════════════════════');
        
        // Datos esperados según la imagen
        const expectedData = {
            amount: 1184.71,
            date: '09/07/2025',
            reference: '003172337789',
            bank: 'BBVA PROVINCIAL',
            identification: '21618076',
            origin: '0102****9203',
            destination: '04143094070',
            concept: 'yenis'
        };
        
        console.log('\n🎯 COMPARACIÓN CON DATOS ESPERADOS:');
        console.log('════════════════════════════════════════');
        console.log('Monto esperado: 1184.71 Bs');
        console.log('Monto detectado:', extractedData.amount);
        console.log('✅ Coincide:', Math.abs(extractedData.amount - expectedData.amount) < 0.01);
        console.log('');
        console.log('Fecha esperada:', expectedData.date);
        console.log('Fecha detectada:', extractedData.date);
        console.log('✅ Coincide:', extractedData.date === expectedData.date);
        console.log('');
        console.log('Referencia esperada:', expectedData.reference);
        console.log('Referencia detectada:', extractedData.reference);
        console.log('✅ Coincide:', extractedData.reference === expectedData.reference);
        console.log('');
        console.log('Banco esperado:', expectedData.bank);
        console.log('Banco detectado:', extractedData.bankName);
        console.log('✅ Coincide:', extractedData.bankName && extractedData.bankName.includes('BBVA') || extractedData.bankName.includes('PROVINCIAL'));
        
        console.log('\n📝 TEXTO COMPLETO EXTRAÍDO:');
        console.log('════════════════════════════════════════');
        console.log(extractedData.rawText);
        console.log('════════════════════════════════════════');
        
        // Evaluar precisión general
        let score = 0;
        let total = 4;
        
        if (Math.abs(extractedData.amount - expectedData.amount) < 0.01) score++;
        if (extractedData.date === expectedData.date) score++;
        if (extractedData.reference === expectedData.reference) score++;
        if (extractedData.bankName && (extractedData.bankName.includes('BBVA') || extractedData.bankName.includes('PROVINCIAL'))) score++;
        
        const accuracy = (score / total) * 100;
        console.log(`\n🎯 PRECISIÓN GENERAL: ${accuracy.toFixed(1)}% (${score}/${total} campos correctos)`);
        
        if (accuracy >= 75) {
            console.log('✅ El OCR está funcionando correctamente!');
        } else {
            console.log('⚠️ El OCR necesita mejoras para esta imagen');
        }
        
    } catch (error) {
        console.error('❌ Error probando OCR:', error);
        console.error('Stack:', error.stack);
    }
}

// Ejecutar prueba
testRealImage().then(() => {
    console.log('\n🏁 Prueba completada');
}).catch(error => {
    console.error('💥 Error fatal:', error);
});
