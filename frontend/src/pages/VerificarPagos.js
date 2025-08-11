import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { statementService, paymentService } from '../services/api';
import { Upload, Image, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatting';

const VerificarPagos = () => {
  const [statements, setStatements] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      const data = await statementService.getStatements();
      setStatements(data);
    } catch (error) {
      console.error('Error al obtener estados de cuenta:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    if (!selectedStatement) {
      setResult({
        type: 'error',
        message: 'Por favor selecciona un estado de cuenta primero'
      });
      return;
    }

    setVerifying(true);
    setResult(null);
    
    const file = acceptedFiles[0];
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    try {
      const response = await paymentService.verifyPayment(file, selectedStatement);
      console.log('Respuesta de la API de verificación:', response);
      
      setResult({
        type: response.validationResult.isValid ? 'success' : 'warning',
        message: response.validationResult.isValid ? 'Pago verificado exitosamente' : 'Pago no pudo ser verificado',
        data: response
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Error al verificar el pago'
      });
    } finally {
      setVerifying(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verificar Pagos</h1>
        <p className="text-gray-600">Sube una imagen de pago para verificar contra un estado de cuenta</p>
      </div>

      {/* Selección de estado de cuenta */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Estado de Cuenta</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <select
            value={selectedStatement}
            onChange={(e) => setSelectedStatement(e.target.value)}
            className="input-field"
          >
            <option value="">Selecciona un estado de cuenta</option>
            {statements.map((statement) => (
              <option key={statement.id} value={statement.id}>
                {statement.filename} - {new Date(statement.upload_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Zona de subida de pago */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir Captura de Pago</h2>
        
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Vista previa del pago" className="w-full max-w-sm mx-auto rounded-lg shadow-md" />
            <button
              onClick={() => {
                URL.revokeObjectURL(imagePreview);
                setImagePreview(null);
                setResult(null);
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              aria-label="Eliminar imagen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Image className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Suelta la imagen aquí...'
                : 'Arrastra y suelta una imagen aquí, o haz clic para seleccionar'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos soportados: PNG, JPG, JPEG
            </p>
          </div>
        )}

        {verifying && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-sm text-gray-600">Verificando pago...</span>
          </div>
        )}

        {result && (
          <div className={`mt-4 p-4 rounded-md border ${
            result.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : result.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {result.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={
                result.type === 'success' 
                  ? 'text-green-700' 
                  : result.type === 'warning'
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }>
                {result.message}
              </span>
            </div>
            
            {result.data && (
              <div className="mt-3 text-sm">
                <p className="font-medium">Datos extraídos:</p>
                <ul className="mt-1 space-y-1">
                  {result.data.extractedData.amount && (
                    <li>• Monto: ${formatCurrency(result.data.extractedData.amount)}</li>
                  )}
                  {result.data.extractedData.date && (
                    <li>• Fecha: {result.data.extractedData.date}</li>
                  )}
                  {result.data.extractedData.reference && (
                    <li>• Referencia: {result.data.extractedData.reference}</li>
                  )}
                </ul>
                <p className="mt-2">
                  Confianza: {Math.round((result.data.validationResult.confidence || 0) * 100)}%
                </p>
              </div>
            )}

            {result.type === 'success' && result.data?.validationResult?.matches?.[0] && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                <p className="font-medium text-gray-800">Coincidencia encontrada en Estado de Cuenta:</p>
                <ul className="mt-1 space-y-1 text-gray-600">
                  <li>• Monto: ${formatCurrency(result.data.validationResult.matches[0].transaction.amount)}</li>
                  <li>• Fecha: {result.data.validationResult.matches[0].transaction.date}</li>
                  <li>• Referencia: {result.data.validationResult.matches[0].transaction.reference_number}</li>
                  <li>• Descripción: {result.data.validationResult.matches[0].transaction.description}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificarPagos;
