import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { statementService } from '../services/api';
import { formatCurrency } from '../utils/formatting';

const StatementDetails = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await statementService.getStatementTransactions(id);
        setTransactions(data);
      } catch (err) {
        setError('Error al cargar las transacciones.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link to="/estados-cuenta" className="text-primary-600 hover:underline">
          &larr; Volver a Estados de Cuenta
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Detalles del Estado de Cuenta</h1>
        <p className="text-gray-600">Transacciones extraídas del archivo.</p>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
              <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 whitespace-nowrap">{tx.date}</td>
                  <td className="py-4 px-6">{tx.description}</td>
                  <td className="py-4 px-6 whitespace-nowrap">{tx.reference_number}</td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">{formatCurrency(tx.balance)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">No se encontraron transacciones.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatementDetails;
