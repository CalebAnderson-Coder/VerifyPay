#!/bin/bash

# Script robusto para servidor OCR
echo "🚀 Iniciando servidor OCR robusto..."

# Matar procesos existentes
pkill -f "test-ocr-endpoint.js" 2>/dev/null

# Ir al directorio
cd /Users/KASHA/verifypay/backend

# Iniciar servidor
echo "📡 Iniciando servidor en puerto 3003..."
node test-ocr-endpoint.js &
SERVER_PID=$!

# Esperar a que inicie
sleep 3

# Verificar que está funcionando
if curl -s http://localhost:3003 > /dev/null; then
    echo "✅ Servidor OCR funcionando correctamente"
    echo "🌐 Accede a: http://localhost:3003"
    echo "📱 PID del servidor: $SERVER_PID"
    echo ""
    echo "🔍 Características disponibles:"
    echo "• Comparación visual OCR vs Estado de cuenta"
    echo "• Validación automática con % de confianza"
    echo "• Soporte para bancos venezolanos"
    echo "• Procesamiento en tiempo real"
    echo ""
    echo "🧪 Montos de prueba configurados:"
    echo "• $789.00 (Ref: 123456789)"
    echo "• $1184.71 (Ref: 003172337789)"
    echo "• $250.50 (Ref: 987654321)"
    echo ""
    echo "💡 Para detener el servidor:"
    echo "   kill $SERVER_PID"
    echo ""
    
    # Abrir navegador
    echo "🌐 Abriendo navegador..."
    open http://localhost:3003
    
    echo "✅ Servidor listo para usar!"
else
    echo "❌ Error: El servidor no se pudo iniciar"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
