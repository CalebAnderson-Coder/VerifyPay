#!/bin/bash

# Script para probar solo el OCR
echo "🔍 Iniciando servidor de pruebas OCR..."
echo "════════════════════════════════════════════════════════════"

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidor de pruebas..."
    pkill -f "test-ocr-endpoint.js" 2>/dev/null
    echo "✅ Servidor detenido"
    exit 0
}

# Configurar trap para limpiar al salir
trap cleanup INT TERM

# Verificar que el archivo existe
if [ ! -f "/Users/KASHA/verifypay/backend/test-ocr-endpoint.js" ]; then
    echo "❌ Error: Archivo de pruebas OCR no encontrado"
    exit 1
fi

# Cambiar al directorio del backend
cd /Users/KASHA/verifypay/backend

# Verificar dependencias
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias..."
    npm install
fi

# Iniciar servidor de pruebas
echo "🚀 Iniciando servidor de pruebas OCR..."
node test-ocr-endpoint.js &
SERVER_PID=$!

# Esperar a que el servidor inicie
sleep 3

# Mostrar información
echo ""
echo "✅ Servidor de pruebas OCR corriendo:"
echo "════════════════════════════════════════════════════════════"
echo "🧪 Pruebas OCR: http://localhost:3003"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📝 Instrucciones:"
echo "1. Ve a http://localhost:3003"
echo "2. Selecciona una imagen de comprobante"
echo "3. Haz clic en 'Analizar Imagen'"
echo "4. Ve los resultados del OCR"
echo ""
echo "💡 Presiona Ctrl+C para detener el servidor"
echo ""

# Abrir navegador automáticamente
if command -v open &> /dev/null; then
    echo "🌐 Abriendo navegador..."
    open http://localhost:3003
fi

# Esperar a que el proceso termine
wait $SERVER_PID
