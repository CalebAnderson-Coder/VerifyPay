#!/bin/bash

# Script de configuración automática para pruebas
echo "⚙️ Configurando VerifyPay para pruebas..."
echo "════════════════════════════════════════════════════════════"

cd /Users/KASHA/verifypay/backend

# 1. Agregar transacciones de prueba
echo "📝 Agregando transacciones de prueba..."
node add-test-transaction.js

# 2. Mostrar estado actual
echo ""
echo "📊 Verificando configuración..."
node diagnose-validation.js

echo ""
echo "✅ VerifyPay configurado para pruebas"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Ahora puedes probar con estas imágenes:"
echo "• Monto: $789.00 → Debería validar con 90% confianza"
echo "• Monto: $1184.71 → Debería validar con 90% confianza"
echo "• Monto: $250.50 → Debería validar con 90% confianza"
echo ""
echo "🚀 Para iniciar la aplicación:"
echo "   ./start-verifypay.sh"
echo ""
echo "🧪 Para solo probar OCR:"
echo "   ./test-ocr-only.sh"
