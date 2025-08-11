const XLSX = require('xlsx');
const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

class FileProcessor {
    async processStatementFile(filePath, mimeType) {
        try {
            switch (mimeType) {
                case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                case 'application/vnd.ms-excel':
                    return await this.processExcelFile(filePath);
                case 'application/pdf':
                    return await this.processPDFFile(filePath);
                case 'text/csv':
                    return await this.processCSVFile(filePath);
                default:
                    // Intenta procesar como CSV si es un tipo de texto
                    if (mimeType.startsWith('text/')) {
                        return await this.processCSVFile(filePath);
                    }
                    throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
            }
        } catch (error) {
            console.error('Error procesando archivo:', error);
            throw error;
        }
    }

    async processExcelFile(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convertir a JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Procesar datos
            const transactions = this.parseExcelTransactions(jsonData);
            
            return transactions;
        } catch (error) {
            console.error('Error procesando archivo Excel:', error);
            throw new Error('No se pudo procesar el archivo Excel');
        }
    }

    parseExcelTransactions(data) {
        const transactions = [];
        // Asumimos que la primera fila es el encabezado y los datos comienzan en la segunda.
        const dataRows = data.slice(1);

        for (const row of dataRows) {
            if (!row || row.length < 3) continue; // Necesitamos al menos fecha, descripción y monto

            const description = row[1] ? row[1].toString().trim() : '';
            
            // Extraer referencia de la descripción (número de 11 dígitos o similar)
            const refMatch = description.match(/(\d{7,})/);
            const reference = refMatch ? refMatch[0] : null;

            const transaction = {
                date: this.parseDate(row[0]),
                description: description,
                amount: this.parseAmount(row[2]),
                balance: this.parseAmount(row[3]),
                type: description.startsWith('CR') ? 'credit' : 'debit',
                reference: reference
            };

            if (transaction.date && transaction.amount !== null) {
                transactions.push(transaction);
            }
        }

        return transactions;
    }

    mapColumns(headers) {
        const mapping = {
            date: -1,
            description: -1,
            amount: -1,
            balance: -1,
            type: -1,
            reference: -1
        };

        headers.forEach((header, index) => {
            if (!header) return;
            
            const headerLower = header.toString().toLowerCase();
            
            // Fecha
            if (headerLower.includes('fecha') || headerLower.includes('date')) {
                mapping.date = index;
            }
            // Descripción
            else if (headerLower.includes('descripción') || headerLower.includes('description') || 
                     headerLower.includes('concepto') || headerLower.includes('detalle')) {
                mapping.description = index;
            }
            // Monto
            else if (headerLower.includes('monto') || headerLower.includes('amount') || 
                     headerLower.includes('débito') || headerLower.includes('crédito')) {
                mapping.amount = index;
            }
            // Saldo
            else if (headerLower.includes('saldo') || headerLower.includes('balance')) {
                mapping.balance = index;
            }
            // Tipo
            else if (headerLower.includes('tipo') || headerLower.includes('type')) {
                mapping.type = index;
            }
            // Referencia
            else if (headerLower.includes('referencia') || headerLower.includes('reference') || 
                     headerLower.includes('número') || headerLower.includes('number')) {
                mapping.reference = index;
            }
        });

        return mapping;
    }

    parseTransactionRow(row, mapping) {
        try {
            const transaction = {
                date: null,
                description: null,
                amount: null,
                balance: null,
                type: null,
                reference: null
            };

            // Extraer fecha
            if (mapping.date !== -1 && row[mapping.date]) {
                transaction.date = this.parseDate(row[mapping.date]);
            }

            // Extraer descripción
            if (mapping.description !== -1 && row[mapping.description]) {
                transaction.description = row[mapping.description].toString().trim();
            }

            // Extraer monto
            if (mapping.amount !== -1 && row[mapping.amount]) {
                transaction.amount = this.parseAmount(row[mapping.amount]);
            }

            // Extraer saldo
            if (mapping.balance !== -1 && row[mapping.balance]) {
                transaction.balance = this.parseAmount(row[mapping.balance]);
            }

            // Extraer tipo
            if (mapping.type !== -1 && row[mapping.type]) {
                transaction.type = row[mapping.type].toString().trim();
            }

            // Extraer referencia
            if (mapping.reference !== -1 && row[mapping.reference]) {
                transaction.reference = row[mapping.reference].toString().trim();
            }

            // Validar que tenga al menos fecha y monto
            if (transaction.date && transaction.amount !== null) {
                return transaction;
            }

            return null;
        } catch (error) {
            console.error('Error parseando fila:', error);
            return null;
        }
    }

    parseDate(dateValue) {
        if (!dateValue) return null;
        
        try {
            // Si es un número de Excel (número de serie)
            if (typeof dateValue === 'number') {
                const date = new Date((dateValue - 25569) * 86400 * 1000);
                return date.toISOString().split('T')[0];
            }
            
            // Si es texto
            const dateStr = dateValue.toString();
            const date = new Date(dateStr);
            
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            
            return dateStr;
        } catch (error) {
            return dateValue.toString();
        }
    }

    parseAmount(amountValue) {
        if (amountValue === null || amountValue === undefined) return null;
    
        try {
            if (typeof amountValue === 'number') {
                return amountValue;
            }
    
            let cleanAmount = amountValue.toString().trim();
    
            // Convertir formato venezolano (e.g., "1.234,56") a formato estándar ("1234.56")
            cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
    
            const amount = parseFloat(cleanAmount);
            return isNaN(amount) ? null : amount;
        } catch (error) {
            console.error(`Error al parsear monto: ${amountValue}`, error);
            return null;
        }
    }

    async processPDFFile(filePath) {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            
            const transactions = this.parsePDFTransactions(data.text);
            
            return transactions;
        } catch (error) {
            console.error('Error procesando archivo PDF:', error);
            throw new Error('No se pudo procesar el archivo PDF');
        }
    }

    parsePDFTransactions(text) {
        const transactions = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Patrones para identificar transacciones
        const datePattern = /(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|\d{4}-\d{1,2}-\d{1,2})/;
        const amountPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
        
        for (const line of lines) {
            const dateMatch = line.match(datePattern);
            const amountMatches = line.match(new RegExp(amountPattern.source, 'g'));
            
            if (dateMatch && amountMatches) {
                const transaction = {
                    date: dateMatch[1],
                    description: line.replace(datePattern, '').replace(amountPattern, '').trim(),
                    amount: parseFloat(amountMatches[0].replace(/,/g, '')),
                    balance: amountMatches.length > 1 ? parseFloat(amountMatches[1].replace(/,/g, '')) : null,
                    type: null,
                    reference: null
                };
                
                transactions.push(transaction);
            }
        }
        
        return transactions;
    }

    async processCSVFile(filePath) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            const transactions = [];
            // Expresión regular para capturar los campos del formato específico del CSV
            const transactionRegex = /^"(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+([\d.,]+)\s+([\d.,]+)"$/;

            for (const line of lines) {
                const match = line.match(transactionRegex);
                if (match) {
                    const [, date, description, amount, balance] = match;
                    
                    // Extraer referencia de la descripción (número de 11 dígitos)
                    const refMatch = description.match(/(\d{11})/);
                    const reference = refMatch ? refMatch[1] : null;

                    transactions.push({
                        date: date,
                        description: description.trim(),
                        amount: this.parseAmount(amount),
                        balance: this.parseAmount(balance),
                        type: description.startsWith('CR') ? 'credit' : 'debit',
                        reference: reference
                    });
                }
            }
            
            return transactions;
        } catch (error) {
            console.error('Error procesando archivo CSV:', error);
            throw new Error('No se pudo procesar el archivo CSV');
        }
    }
}

module.exports = new FileProcessor();
