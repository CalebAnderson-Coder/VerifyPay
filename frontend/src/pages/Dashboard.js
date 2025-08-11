import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error al obtener estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Estados de Cuenta',
      value: stats?.totalStatements || 0,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      title: 'Pagos Verificados',
      value: stats?.verifiedPayments || 0,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Pagos Pendientes',
      value: stats?.pendingPayments || 0,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      title: 'Total Verificaciones',
      value: stats?.totalVerifications || 0,
      icon: AlertCircle,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Gestiona y procesa estados de cuenta bancarios</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`${card.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            <div className="flex items-center py-2">
              <FileText className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Estado de cuenta cargado</p>
                <p className="text-xs text-gray-500">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-center py-2">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Pago verificado exitosamente</p>
                <p className="text-xs text-gray-500">Hace 4 horas</p>
              </div>
            </div>
            <div className="flex items-center py-2">
              <Clock className="w-5 h-5 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Verificación pendiente</p>
                <p className="text-xs text-gray-500">Hace 6 horas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left">
              Subir Estado de Cuenta
            </button>
            <button className="w-full btn-secondary text-left">
              Verificar Nuevo Pago
            </button>
            <button className="w-full btn-secondary text-left">
              Ver Historial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
