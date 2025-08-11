#!/bin/bash

# Script para iniciar la aplicación VerifyPay
echo "🚀 Iniciando VerifyPay App..."

# Función para limpiar procesos al salir
cleanup() {
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Configurar trap para limpiar al salir
trap cleanup INT TERM

# Iniciar el backend
echo "📡 Iniciando backend..."
cd /Users/KASHA/verifypay/backend
npm start &
BACKEND_PID=$!

# Esperar un poco para que el backend inicie
sleep 5

# Iniciar el frontend
echo "🌐 Iniciando frontend..."
cd /Users/KASHA/verifypay/frontend
npm start &
FRONTEND_PID=$!

# Mostrar información
echo ""
echo "✅ VerifyPay App está corriendo:"
echo "   🖥️  Frontend: http://localhost:3002"
echo "   🔧 Backend:  http://localhost:5000"
echo ""
echo "Presiona Ctrl+C para detener ambos servicios"

# Esperar a que ambos procesos terminen
wait $BACKEND_PID $FRONTEND_PID
