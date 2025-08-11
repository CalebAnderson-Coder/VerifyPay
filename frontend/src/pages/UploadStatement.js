import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { statementService } from '../services/api';

const UploadStatement = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);
  const [extractedTransactions, setExtractedTransactions] = useState([]);

  const onDrop = async (acceptedFiles) => {
    try {
      const file = acceptedFiles[0];
      setUploadedFiles((prev) => [...prev, file]);
      setExtractedTransactions([]); // Limpiar transacciones anteriores

      const response = await statementService.uploadStatement(file);
      setStatusMessage(`Archivo subido con éxito. Transacciones procesadas: ${response.transactionsCount}`);
      if (response.transactions) {
        setExtractedTransactions(response.transactions);
      }
    } catch (error) {
      setStatusMessage('Error al subir el archivo');
      setExtractedTransactions([]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
    }
  });

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Subir Estado de Cuenta</h2>

      <div {...getRootProps({ className: 'dropzone border-2 border-dashed border-gray-300 p-6 rounded-md text-center' })}>
        <input {...getInputProps()} />
        <p>Arrastra y suelta un archivo aquí, o haz clic para seleccionar un archivo</p>
        <p className="text-sm text-gray-500">Formatos soportados: XLS, XLSX, PDF, CSV</p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium">Archivos subidos:</h3>
          <ul>
            {uploadedFiles.map((file, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                {file.name} - {file.size} bytes
              </li>
            ))}
          </ul>
        </div>
      )}

      {statusMessage && (
        <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md">
          {statusMessage}
        </div>
      )}

      {extractedTransactions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">Transacciones Extraídas</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b">Fecha</th>
                  <th className="py-2 px-4 border-b">Descripción</th>
                  <th className="py-2 px-4 border-b">Referencia</th>
                  <th className="py-2 px-4 border-b">Monto</th>
                  <th className="py-2 px-4 border-b">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {extractedTransactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{tx.date}</td>
                    <td className="py-2 px-4 border-b">{tx.description}</td>
                    <td className="py-2 px-4 border-b">{tx.reference}</td>
                    <td className="py-2 px-4 border-b text-right">{tx.amount}</td>
                    <td className="py-2 px-4 border-b text-right">{tx.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadStatement;
