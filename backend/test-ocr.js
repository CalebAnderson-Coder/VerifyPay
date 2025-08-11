const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function testOCR() {
    console.log('🔍 Iniciando prueba de OCR...');
    
    try {
        // Crear una imagen de prueba simple
        const testImagePath = path.join(__dirname, 'test-image.png');
        
        // Crear imagen de prueba con Sharp
        console.log('📝 Creando imagen de prueba...');
        const testText = 'Pago: $1,250.00\nFecha: 14/07/2024\nReferencia: TRX123456';
        
        const svg = `
            <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="400" height="200" fill="white"/>
                <text x="20" y="30" font-family="Arial" font-size="16" fill="black">Pago: $1,250.00</text>
                <text x="20" y="60" font-family="Arial" font-size="16" fill="black">Fecha: 14/07/2024</text>
                <text x="20" y="90" font-family="Arial" font-size="16" fill="black">Referencia: TRX123456</text>
                <text x="20" y="120" font-family="Arial" font-size="16" fill="black">Banco: Mercantil</text>
                <text x="20" y="150" font-family="Arial" font-size="16" fill="black">Cuenta: 0105-1234-56-7890123456</text>
            </svg>
        `;
        
        await sharp(Buffer.from(svg))
            .png()
            .toFile(testImagePath);
        
        console.log('✅ Imagen de prueba creada');
        
        // Verificar versión de Tesseract
        console.log('📦 Verificando versión de Tesseract...');
        console.log('Tesseract.js versión:', require('tesseract.js/package.json').version);
        
        // Probar OCR básico
        console.log('🔄 Iniciando worker de OCR...');
        const worker = await Tesseract.createWorker('spa', 1, {
            logger: m => console.log('📊 OCR:', m)
        });
        
        console.log('⚙️  Configurando parámetros...');
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóúñü.,:-/\\$\\s',
            tessedit_pageseg_mode: '6',
            tessjs_create_hocr: '1',
            tessjs_create_tsv: '1'
        });
        
        console.log('🔍 Ejecutando OCR...');
        const { data: { text } } = await worker.recognize(testImagePath);
        
        console.log('✅ OCR completado!');
        console.log('📄 Texto extraído:', text);
        
        // Probar el parsing
        console.log('🔧 Probando parsing...');
        const ocrService = require('./services/ocrService');
        const parsedData = ocrService.parsePaymentText(text);
        
        console.log('📊 Datos parseados:', parsedData);
        
        // Limpiar
        await worker.terminate();
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
        }
        
        console.log('✅ Prueba de OCR completada exitosamente');
        
    } catch (error) {
        console.error('❌ Error en prueba de OCR:', error);
        console.error('Stack:', error.stack);
        
        // Diagnóstico adicional
        console.log('\n🔍 Diagnóstico adicional:');
        console.log('- Node.js versión:', process.version);
        console.log('- Plataforma:', process.platform);
        console.log('- Arquitectura:', process.arch);
        
        // Verificar dependencias
        try {
            const tesseractPath = require.resolve('tesseract.js');
            console.log('- Tesseract.js ubicación:', tesseractPath);
        } catch (e) {
            console.log('- Tesseract.js no encontrado');
        }
        
        try {
            const sharpPath = require.resolve('sharp');
            console.log('- Sharp ubicación:', sharpPath);
        } catch (e) {
            console.log('- Sharp no encontrado');
        }
    }
}

// Ejecutar prueba
testOCR().then(() => {
    console.log('🏁 Prueba completada');
    process.exit(0);
}).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
});
