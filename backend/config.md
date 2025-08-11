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
