const ocrService = require('./services/ocrService');

// Simular texto extraído del OCR
const testText = `PagomóvilBDVPersonas
1.184,71Bs
Fecha: 027/07/7/0745
Operación: 003172337789IO
Identificación: 21618076
Origen: 01029203
Destino: 07:87.107:107/0
Banco: 0108-BBVAPROVINCIAL
Concepto: venis`;

console.log('🔍 Probando extracción de referencia mejorada...\n');

// Probar el parsing
const extractedData = ocrService.parsePaymentText(testText);

console.log('\n📊 RESULTADOS:');
console.log('═══════════════════════════════════════');
console.log('🔗 Referencia extraída:', extractedData.reference);
console.log('✅ Esperado: "003172337789"');
console.log('✅ Correcto:', extractedData.reference === '003172337789');

console.log('\n📋 Otros datos extraídos:');
console.log('💰 Monto:', extractedData.amount);
console.log('🏦 Banco:', extractedData.bankName);
console.log('📄 Concepto:', extractedData.description);
