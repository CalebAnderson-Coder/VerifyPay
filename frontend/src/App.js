import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EstadosCuenta from './pages/EstadosCuenta';
import StatementDetails from './pages/StatementDetails';
import VerificarPagos from './pages/VerificarPagos';
import Historial from './pages/Historial';
import Movimientos from './pages/Movimientos';
import Configuracion from './pages/Configuracion';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const { token } = useAuth();

  // Si no hay token, mostrar login
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/estados-cuenta" element={<EstadosCuenta />} />
          <Route path="/estados-cuenta/:id" element={<StatementDetails />} />
          <Route path="/verificar-pagos" element={<VerificarPagos />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
