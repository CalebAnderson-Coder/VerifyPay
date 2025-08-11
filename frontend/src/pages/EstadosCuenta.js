import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { statementService } from '../services/api';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const EstadosCuenta = () => {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

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
    setUploading(true);
    setMessage(null);
    
    try {
      const file = acceptedFiles[0];
      const response = await statementService.uploadStatement(file);
      
      setMessage({
        type: 'success',
        text: `Estado de cuenta subido exitosamente. ${response.transactionsCount || 0} transacciones procesadas.`
      });
      
      // Recargar lista de estados de cuenta
      fetchStatements();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error al subir el estado de cuenta'
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/html': ['.html']
    },
    maxFiles: 1
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileText className="w-5 h-5 text-green-600" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    } else {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estados de Cuenta</h1>
        <p className="text-gray-600">Gestiona y procesa estados de cuenta bancarios</p>
      </div>

      {/* Zona de subida */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subir Estado de Cuenta</h2>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Suelta el archivo aquí...'
              : 'Arrastra y suelta un archivo aquí, o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Formatos soportados: XLS, XLSX, HTML
          </p>
        </div>

        {uploading && (
          <div className="mt-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-sm text-gray-600">Subiendo archivo...</span>
          </div>
        )}

        {message && (
          <div className={`mt-4 p-4 rounded-md flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            )}
            <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </span>
          </div>
        )}
      </div>

      {/* Lista de estados de cuenta */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Estados de Cuenta Cargados</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : statements.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No hay estados de cuenta cargados
          </p>
        ) : (
          <div className="space-y-3">
            {statements.map((statement) => (
              <div key={statement.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center">
                  {getFileIcon(statement.file_type)}
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{statement.filename}</p>
                    <p className="text-xs text-gray-500">
                      Subido el {formatDate(statement.upload_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    statement.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {statement.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                  <Link to={`/estados-cuenta/${statement.id}`} className="text-primary-600 hover:text-primary-700 text-sm">
                    Ver detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EstadosCuenta;
