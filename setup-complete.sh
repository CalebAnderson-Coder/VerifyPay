#!/bin/bash

# Script de configuración completa para VerifyPay
echo "⚙️ Configuración Completa de VerifyPay"
echo "════════════════════════════════════════════════════════════"

cd /Users/KASHA/verifypay

# 1. Configurar base de datos con transacciones de prueba
echo "🗄️ Configurando base de datos..."
cd backend
node add-test-transaction.js

# 2. Verificar configuración
echo ""
echo "🔍 Verificando configuración..."
node diagnose-validation.js

# 3. Crear archivo de configuración
echo ""
echo "📝 Creando archivo de configuración..."
cat > config.md << 'EOF'
# VerifyPay - Configuración Completa

## ✅ Sistema Configurado
- ✅ Base de datos SQLite inicializada
- ✅ Usuario de prueba: ia_inovashop
- ✅ Estados de cuenta con transacciones
- ✅ Transacciones de prueba agregadas
- ✅ OCR optimizado para bancos venezolanos

## 🧪 Transacciones de Prueba Disponibles
- $789.00 (Ref: 123456789) - Pago PagomóvilBDV
- $1184.71 (Ref: 003172337789) - Transferencia bancaria  
- $250.50 (Ref: 987654321) - Pago móvil

## 📱 URLs de Acceso
- App Principal: http://localhost:3002
- API Backend: http://localhost:5000
- Pruebas OCR: http://localhost:3003

## 🎯 Funcionalidades Configuradas
- ✅ OCR con comparación visual
- ✅ Validación automática
- ✅ Interfaz de comparación lado a lado
- ✅ Múltiples coincidencias
- ✅ Confianza en porcentaje

## 🔧 Comandos Disponibles
```bash
# Iniciar aplicación completa
./start-verifypay.sh

# Solo pruebas OCR
./test-ocr-only.sh

# Diagnóstico
cd backend && node diagnose-validation.js
```
EOF

echo "✅ Configuración completada"
echo ""
echo "🎉 VerifyPay está listo para usar!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📋 Características principales:"
echo "• 🔍 OCR inteligente con comparación visual"
echo "• 📊 Validación automática contra estados de cuenta"
echo "• 🎯 Porcentaje de confianza en tiempo real"
echo "• 💰 Soporte para montos venezolanos (Bs)"
echo "• 🏦 Reconocimiento de bancos locales"
echo "• 📱 Interfaz responsive y fácil de usar"
echo ""
echo "🚀 Para comenzar:"
echo "   ./start-verifypay.sh"
echo ""
echo "🧪 Para solo probar OCR:"
echo "   ./test-ocr-only.sh"
echo ""
echo "📖 Documentación completa en: config.md"
