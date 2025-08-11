const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

class OCRService {
    constructor() {
        this.worker = null;
        this.initializationPromise = this.initializeWorker();
    }

    async initializeWorker() {
        try {
            const worker = await Tesseract.createWorker('spa', 1, {
                logger: m => console.log(m)
            });
            
            // Configurar el OCR para mejor reconocimiento de texto bancario
            await worker.setParameters({
                tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóúñü.,:-/\\$\\s',
                tessedit_pageseg_mode: '6', // Uniform block of text
                tessjs_create_hocr: '1',
                tessjs_create_tsv: '1'
            });
            this.worker = worker;
        } catch (error) {
            console.error('Error inicializando OCR worker:', error);
            this.worker = null; // Asegurarse de que el worker es nulo si falla
        }
    }

    async preprocessImage(imagePath) {
        try {
            const processedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.png');
            
            // Preprocesamiento simplificado para mejorar la precisión
            await sharp(imagePath)
                .resize(2000, null, { withoutEnlargement: true })
                .greyscale()
                .normalize()
                .sharpen()
                .threshold(150)
                .png({ quality: 100 })
                .toFile(processedPath);
            
            return processedPath;
        } catch (error) {
            console.error('Error procesando imagen:', error);
            // Si falla el procesamiento avanzado, intentar uno básico
            try {
                const basicPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_basic.png');
                await sharp(imagePath)
                    .resize(1800, null)
                    .greyscale()
                    .normalize()
                    .png()
                    .toFile(basicPath);
                return basicPath;
            } catch (basicError) {
                return imagePath;
            }
        }
    }

    async extractPaymentData(imagePath) {
        try {
            await this.initializationPromise; // Esperar a que la inicialización se complete
            if (!this.worker) {
                throw new Error('OCR worker no está inicializado correctamente.');
            }

            // Preprocesar la imagen para mejorar el OCR
            const processedImagePath = await this.preprocessImage(imagePath);
            
            // Extraer texto usando OCR
            const { data: { text } } = await this.worker.recognize(processedImagePath);
            
            // Limpiar el archivo procesado
            if (processedImagePath !== imagePath) {
                fs.unlinkSync(processedImagePath);
            }
            
            // Parsear el texto extraído
            const extractedData = this.parsePaymentText(text);
            
            return extractedData;
        } catch (error) {
            console.error('Error extrayendo datos de pago:', error);
            throw new Error('No se pudo extraer información de la imagen');
        }
    }

    parsePaymentText(text) {
        console.log('Texto extraído por OCR:', text);
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        const paymentData = {
            amount: null,
            date: null,
            reference: null,
            description: null,
            bankName: null,
            accountNumber: null,
            rawText: text
        };

        // Procesar cada línea individualmente
        for (const line of lines) {
            const lineLower = line.toLowerCase();
            console.log('Procesando línea:', line);
            
            // Extraer fecha - ajustado para posibles errores de OCR
            if (lineLower.includes('fecha') && !paymentData.date) {
                // Busca un patrón de fecha flexible, permitiendo errores de OCR
                let dateMatch = line.match(/(\d{1,2}[\/|-]\d{1,2}[\/|-]\d{4})/);
                if (dateMatch) {
                    // Limpiar la fecha de caracteres no deseados
                    paymentData.date = dateMatch[1].replace(/[^0-9\/]/g, '');
                    console.log('Fecha encontrada:', paymentData.date);
                }
            }
            
            // Extraer referencia/operación (PagomóvilBDV usa "Operación") - ajustado para 12 dígitos
            if ((lineLower.includes('referencia') || lineLower.includes('ref') || lineLower.includes('trx') || lineLower.includes('operación') || lineLower.includes('operacion')) && !paymentData.reference) {
                // Buscar un número de 7 a 14 dígitos para más flexibilidad
                const refMatch = line.match(/(?:referencia|ref|trx|operación|operacion)[:\s]*(\d{7,14})/i);
                if (refMatch) {
                    paymentData.reference = refMatch[1];
                }
            }
            
            // Extraer banco (incluir patrones específicos para PagomóvilBDV)
            if ((lineLower.includes('banco') || /banesco|mercantil|venezuela|bancaribe|provincial|bbva|bdc/.test(lineLower)) && !paymentData.bankName) {
                // Buscar patrón específico "0108 - BBVA PROVINCIAL"
                const bankCodeMatch = line.match(/(\d{4})\s*-\s*([A-Z\s]+)/i);
                if (bankCodeMatch) {
                    paymentData.bankName = bankCodeMatch[2].trim();
                } else {
                    const bankMatch = line.match(/(?:banco[:\s]*)?([a-zA-Z\s]+)/i);
                    if (bankMatch) {
                        paymentData.bankName = bankMatch[1].trim();
                    }
                }
            }
            
            // Extraer número de cuenta (incluir patrones para cuentas enmascaradas)
            if ((lineLower.includes('cuenta') || lineLower.includes('origen') || lineLower.includes('destino')) && !paymentData.accountNumber) {
                // Buscar cuenta completa
                const accountMatch = line.match(/(\d{4}[-\s]?\d{4}[-\s]?\d{2}[-\s]?\d{10})/);
                if (accountMatch) {
                    paymentData.accountNumber = accountMatch[1];
                } else {
                    // Buscar cuenta enmascarada (ej: 0102****9203)
                    const maskedAccountMatch = line.match(/(\d{4}\*{4}\d{4})/);
                    if (maskedAccountMatch) {
                        paymentData.accountNumber = maskedAccountMatch[1];
                    } else {
                        // Buscar número de teléfono como destino
                        const phoneMatch = line.match(/(\d{11})/);
                        if (phoneMatch && phoneMatch[1].startsWith('041')) {
                            paymentData.accountNumber = phoneMatch[1];
                        }
                    }
                }
            }
            
            // Extraer concepto (PagomóvilBDV usa "Concepto")
            if ((lineLower.includes('concepto') || lineLower.includes('pago') || lineLower.includes('transferencia') || lineLower.includes('depósito')) && !paymentData.description) {
                // Para concepto, extraer solo el valor después de "Concepto:"
                if (lineLower.includes('concepto')) {
                    const conceptMatch = line.match(/concepto[:\s]*(.+)/i);
                    if (conceptMatch) {
                        paymentData.description = conceptMatch[1].trim();
                    }
                } else {
                    paymentData.description = line;
                }
            }
        }

        // Extraer monto (buscar en todo el texto) - mejorado para PagomóvilBDV
        const amountPatterns = [
            // Patrón para montos con Bs o $ (ej: "21.070,56 Bs" o "$21,070.56")
            /(?:Bs|\$)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/g,
            // Patrón general para montos numéricos, priorizando los más grandes
            /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/g
        ];
        
        let potentialAmounts = [];

        for (const pattern of amountPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                let cleanAmount = match[1];
                
                // Convertir formato venezolano (21.070,56) a formato estándar (21070.56)
                if (cleanAmount.includes('.') && cleanAmount.includes(',')) {
                    // Si el último separador es ',', es el decimal
                    if (cleanAmount.lastIndexOf(',') > cleanAmount.lastIndexOf('.')) {
                        cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
                    } else {
                        cleanAmount = cleanAmount.replace(/,/g, '');
                    }
                } else if (cleanAmount.includes(',')) {
                    // Si solo hay comas, la última es el decimal
                     if (cleanAmount.split(',').length > 2) {
                        cleanAmount = cleanAmount.replace(/,/g, (match, offset, string) => offset === string.lastIndexOf(',') ? '.' : '');
                     } else {
                        cleanAmount = cleanAmount.replace(',', '.');
                     }
                }
                
                const numericAmount = parseFloat(cleanAmount);
                if (!isNaN(numericAmount) && numericAmount > 0) {
                    potentialAmounts.push(numericAmount);
                }
            }
        }

        if (potentialAmounts.length > 0) {
            // Usar el monto más grande encontrado, que suele ser el principal
            paymentData.amount = Math.max(...potentialAmounts);
        }

        // Si no se encontró descripción, tomar la línea más larga
        if (!paymentData.description) {
            paymentData.description = lines.reduce((longest, current) => 
                current.length > longest.length ? current : longest, '');
        }

        return paymentData;
    }

    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
        }
    }
}

module.exports = new OCRService();
