# VerifyPay 🔍💳

Sistema de verificación de pagos con OCR para comprobantes bancarios venezolanos.

## 🚀 Inicio Rápido

### Opción 1: Aplicación Completa
```bash
./start-verifypay.sh
```

### Opción 2: Solo Pruebas OCR
```bash
./test-ocr-only.sh
```

### Opción 3: Manual
```bash
# Backend
cd backend && npm start

# Frontend (en otra terminal)
cd frontend && PORT=3002 npm start
```

## 📱 URLs de Acceso

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **App Principal** | http://localhost:3002 | Aplicación completa |
| **API Backend** | http://localhost:5000 | API REST |
| **Pruebas OCR** | http://localhost:3003 | Testing OCR |

## 🎯 Características

### ✅ OCR Inteligente
- **Detección de montos** con formato venezolano (1.184,71 Bs)
- **Extracción de fechas** automática
- **Referencias numéricas** (sin símbolos adicionales)
- **Bancos venezolanos** (BBVA, Mercantil, Banesco, etc.)
- **Conceptos de pago** personalizables

### 🏦 Bancos Soportados
- BBVA Provincial
- Banco Mercantil
- Banesco
- Banco de Venezuela
- Bancaribe
- Y más...

### 📄 Formatos Soportados
- **Imágenes**: JPG, PNG, JPEG
- **Estados de cuenta**: PDF, Excel
- **Comprobantes**: PagomóvilBDV, transferencias

## 🔧 Configuración

### Dependencias
- Node.js 18+
- npm 9+
- Sharp (procesamiento de imágenes)
- Tesseract.js (OCR)

### Instalación
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Variables de Entorno
```bash
# backend/.env
JWT_SECRET=tu_clave_secreta
PORT=5000
```

## 📊 Uso del OCR

### 1. Subir Comprobante
- Accede a http://localhost:3002
- Inicia sesión o regístrate
- Sube una imagen de comprobante

### 2. Datos Extraídos
El OCR extrae automáticamente:
- 💰 **Monto**: 1.184,71 Bs
- 📅 **Fecha**: 09/07/2025
- 🔗 **Referencia**: 003172337789
- 🏦 **Banco**: BBVA PROVINCIAL
- 📄 **Concepto**: Pago realizado

### 3. Validación
- Compara con estados de cuenta
- Verifica coincidencias
- Genera reportes

## 🧪 Testing

### Pruebas OCR
```bash
# Servidor de pruebas
./test-ocr-only.sh

# Prueba específica
cd backend
node test-ocr.js
```

### Pruebas con Imagen Real
```bash
# Coloca tu imagen como test-pagomovil.jpg
cd backend
node test-real-image.js
```

## 📁 Estructura del Proyecto

```
verifypay/
├── backend/
│   ├── services/
│   │   ├── ocrService.js      # OCR principal
│   │   ├── fileProcessor.js   # Procesamiento archivos
│   │   └── paymentValidator.js # Validación pagos
│   ├── uploads/               # Archivos subidos
│   └── server.js             # Servidor principal
├── frontend/
│   ├── src/
│   └── public/
├── start-verifypay.sh        # Inicio completo
├── test-ocr-only.sh          # Solo OCR
└── README.md                 # Este archivo
```

## 🐛 Solución de Problemas

### Puerto Ocupado
```bash
# Matar procesos
pkill -f "node.*server.js"
pkill -f "react-scripts start"
```

### OCR No Funciona
```bash
# Verificar dependencias
cd backend
npm install tesseract.js sharp
```

### Imagen No Se Procesa
- Verificar formato (JPG, PNG)
- Tamaño máximo: 10MB
- Resolución mínima: 800x600

## 🔍 Mejoras Futuras

- [ ] Soporte para más bancos
- [ ] Reconocimiento de QR codes
- [ ] API REST pública
- [ ] Modo offline
- [ ] Integración con APIs bancarias

## 📞 Soporte

Para problemas o mejoras:
1. Revisa los logs del servidor
2. Verifica las dependencias
3. Prueba con diferentes imágenes
4. Consulta la documentación

---

**VerifyPay** - Sistema de verificación de pagos con OCR 🇻🇪
