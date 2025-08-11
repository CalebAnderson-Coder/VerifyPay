#!/bin/bash

# Script completo para iniciar VerifyPay
echo "🚀 Iniciando VerifyPay - Sistema de Verificación de Pagos"
echo "════════════════════════════════════════════════════════════"

# Verificar que estamos en el directorio correcto
if [ ! -d "/Users/KASHA/verifypay" ]; then
    echo "❌ Error: Directorio de VerifyPay no encontrado"
    exit 1
fi

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    
    # Matar procesos específicos
    pkill -f "node.*server.js" 2>/dev/null
    pkill -f "npm.*start.*verifypay" 2>/dev/null
    pkill -f "react-scripts start" 2>/dev/null
    
    echo "✅ Servicios detenidos"
    exit 0
}

# Configurar trap para limpiar al salir
trap cleanup INT TERM

# Verificar dependencias
echo "📦 Verificando dependencias..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ Node.js $(node --version) y npm $(npm --version) encontrados"

# Instalar dependencias del backend si es necesario
echo "🔧 Verificando dependencias del backend..."
cd /Users/KASHA/verifypay/backend
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias del backend..."
    npm install
fi

# Instalar dependencias del frontend si es necesario
echo "🔧 Verificando dependencias del frontend..."
cd /Users/KASHA/verifypay/frontend
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependencias del frontend..."
    npm install
fi

# Crear directorio de uploads si no existe
mkdir -p /Users/KASHA/verifypay/backend/uploads/{statements,payments}

echo "✅ Dependencias verificadas"
echo ""

# Iniciar el backend
echo "📡 Iniciando backend (puerto 5000)..."
cd /Users/KASHA/verifypay/backend
npm start &
BACKEND_PID=$!

# Esperar a que el backend inicie
sleep 3

# Verificar que el backend está corriendo
if ! curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "⚠️  Backend iniciando (puede tardar unos segundos)..."
    sleep 2
fi

# Iniciar el frontend
echo "🌐 Iniciando frontend (puerto 3002)..."
cd /Users/KASHA/verifypay/frontend
PORT=3002 npm start &
FRONTEND_PID=$!

# Esperar a que el frontend compile
echo "⏳ Esperando a que el frontend compile..."
sleep 10

# Mostrar información final
echo ""
echo "✅ VerifyPay está corriendo:"
echo "════════════════════════════════════════════════════════════"
echo "🖥️  Frontend (App principal): http://localhost:3002"
echo "🔧 Backend (API):            http://localhost:5000"
echo "🧪 Pruebas OCR:             http://localhost:3003"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📝 Características disponibles:"
echo "• 📤 Subir estados de cuenta (Excel, PDF)"
echo "• 📱 Verificar comprobantes de pago (OCR)"
echo "• 📊 Dashboard con estadísticas"
echo "• 🔐 Sistema de autenticación"
echo "• 🏦 Soporte para bancos venezolanos"
echo "• 📋 Historial de verificaciones"
echo ""
echo "🎯 Para probar el OCR:"
echo "1. Ve a http://localhost:3002"
echo "2. Regístrate o inicia sesión"
echo "3. Sube un comprobante de pago"
echo "4. El OCR extraerá automáticamente los datos"
echo ""
echo "💡 Presiona Ctrl+C para detener todos los servicios"
echo ""

# Abrir el navegador automáticamente
if command -v open &> /dev/null; then
    echo "🌐 Abriendo navegador..."
    open http://localhost:3002
fi

# Esperar a que ambos procesos terminen
wait $BACKEND_PID $FRONTEND_PID
