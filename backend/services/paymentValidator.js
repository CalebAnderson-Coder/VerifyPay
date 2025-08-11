const db = require('../database');

class PaymentValidator {
    async validatePayment(extractedData, statementId) {
        try {
            const validationResult = {
                isValid: false,
                confidence: 0,
                matches: [],
                errors: [],
                details: {
                    amountMatch: false,
                    dateMatch: false,
                    referenceMatch: false,
                    descriptionMatch: false
                }
            };

            // Obtener transacciones del estado de cuenta
            const transactions = await this.getStatementTransactions(statementId);
            
            if (transactions.length === 0) {
                validationResult.errors.push('No se encontraron transacciones en el estado de cuenta');
                return validationResult;
            }

            // Validar datos extraídos
            if (!extractedData.amount) {
                validationResult.errors.push('No se pudo extraer el monto del pago');
            }

            if (!extractedData.date) {
                validationResult.errors.push('No se pudo extraer la fecha del pago');
            }

            if (validationResult.errors.length > 0) {
                return validationResult;
            }

            // Buscar coincidencias
            const matches = this.findMatches(extractedData, transactions);
            validationResult.matches = matches;

            if (matches.length > 0) {
                // Evaluar la mejor coincidencia
                const bestMatch = this.evaluateBestMatch(matches, extractedData);
                validationResult.confidence = bestMatch.confidence;
                validationResult.details = bestMatch.details;
                validationResult.isValid = bestMatch.confidence >= 0.7; // 70% de confianza mínima
            }

            return validationResult;
        } catch (error) {
            console.error('Error validando pago:', error);
            throw new Error('Error durante la validación del pago');
        }
    }

    async getStatementTransactions(statementId) {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM statement_transactions WHERE statement_id = ? ORDER BY date DESC', 
                [statementId], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
        });
    }

    findMatches(extractedData, transactions) {
        const matches = [];
        const extractedAmount = parseFloat(extractedData.amount);
        const extractedDate = this.normalizeDate(extractedData.date);

        for (const transaction of transactions) {
            const match = {
                transaction: transaction,
                confidence: 0,
                details: {
                    amountMatch: false,
                    dateMatch: false,
                    referenceMatch: false,
                    descriptionMatch: false
                }
            };

            // Verificar monto
            if (Math.abs(parseFloat(transaction.amount) - extractedAmount) < 0.01) {
                match.details.amountMatch = true;
                match.confidence += 0.4; // 40% de peso para el monto
            }

            // Verificar fecha
            const transactionDate = this.normalizeDate(transaction.date);
            if (this.compareDates(extractedDate, transactionDate)) {
                match.details.dateMatch = true;
                match.confidence += 0.3; // 30% de peso para la fecha
            }

            // Verificar referencia
            if (extractedData.reference && transaction.reference_number) {
                if (extractedData.reference === transaction.reference_number) {
                    match.details.referenceMatch = true;
                    match.confidence += 0.2; // 20% de peso para la referencia
                }
            }

            // Verificar descripción
            if (extractedData.description && transaction.description) {
                const similarity = this.calculateStringSimilarity(
                    extractedData.description.toLowerCase(), 
                    transaction.description.toLowerCase()
                );
                if (similarity > 0.6) {
                    match.details.descriptionMatch = true;
                    match.confidence += 0.1 * similarity; // 10% de peso para la descripción
                }
            }

            // Solo incluir coincidencias con confianza mínima
            if (match.confidence > 0.3) {
                matches.push(match);
            }
        }

        return matches.sort((a, b) => b.confidence - a.confidence);
    }

    evaluateBestMatch(matches, extractedData) {
        if (matches.length === 0) {
            return {
                confidence: 0,
                details: {
                    amountMatch: false,
                    dateMatch: false,
                    referenceMatch: false,
                    descriptionMatch: false
                }
            };
        }

        const bestMatch = matches[0];
        return {
            confidence: bestMatch.confidence,
            details: bestMatch.details,
            transaction: bestMatch.transaction
        };
    }

    normalizeDate(dateStr) {
        if (!dateStr) return null;
        
        try {
            // Manejar formato DD/MM/YYYY
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    // Validar que las partes son números
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        return `${year}-${month}-${day}`;
                    }
                }
            }
            
            // Manejar otros formatos que new Date() puede parsear (ej. YYYY-MM-DD)
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return null;
            }

            // Devolver en formato YYYY-MM-DD
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error(`Error normalizando fecha: ${dateStr}`, error);
            return null;
        }
    }

    compareDates(date1, date2) {
        if (!date1 || !date2) return false;
        
        // Permitir diferencia de hasta 2 días
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 2;
    }

    calculateStringSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    async validateMultiplePayments(extractedDataArray, statementId) {
        const results = [];
        
        for (const extractedData of extractedDataArray) {
            const result = await this.validatePayment(extractedData, statementId);
            results.push(result);
        }
        
        return results;
    }
}

module.exports = new PaymentValidator();
