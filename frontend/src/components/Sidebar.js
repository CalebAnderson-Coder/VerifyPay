import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  History, 
  TrendingUp, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/estados-cuenta',
      name: 'Estados de Cuenta',
      icon: FileText
    },
    {
      path: '/verificar-pagos',
      name: 'Verificar Pagos',
      icon: CheckCircle
    },
    {
      path: '/historial',
      name: 'Historial',
      icon: History
    },
    {
      path: '/movimientos',
      name: 'Movimientos',
      icon: TrendingUp
    },
    {
      path: '/configuracion',
      name: 'Configuracion',
      icon: Settings
    }
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="bg-white h-screen w-64 shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">VerifyPay</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="mb-4">
          <p className="text-sm text-gray-600">Sistema de Verificacion de Pagos v1.0</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Cerrar Sesion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
