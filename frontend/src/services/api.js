import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configuración global de axios
axios.defaults.baseURL = API_BASE_URL;

// Interceptor para manejar errores globalmente
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (email, password) => {
    const response = await axios.post('/api/login', { email, password });
    return response.data;
  },

  register: async (username, email, password) => {
    const response = await axios.post('/api/register', { username, email, password });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Servicios para estados de cuenta
export const statementService = {
  uploadStatement: async (file) => {
    const formData = new FormData();
    formData.append('statement', file);
    
    const response = await axios.post('/api/upload-statement', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  getStatements: async () => {
    const response = await axios.get('/api/statements');
    return response.data;
  },

  getStatementTransactions: async (id) => {
    const response = await axios.get(`/api/statements/${id}/transactions`);
    return response.data;
  },

  getStatementById: async (id) => {
    const response = await axios.get(`/api/statements/${id}`);
    return response.data;
  }
};

// Servicios para verificación de pagos
export const paymentService = {
  verifyPayment: async (paymentImage, statementId) => {
    const formData = new FormData();
    formData.append('payment', paymentImage);
    formData.append('statementId', statementId);
    
    const response = await axios.post('/api/verify-payment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  getVerifications: async () => {
    const response = await axios.get('/api/verifications');
    return response.data;
  },

  getVerificationById: async (id) => {
    const response = await axios.get(`/api/verifications/${id}`);
    return response.data;
  }
};

// Servicios para dashboard
export const dashboardService = {
  getStats: async () => {
    const response = await axios.get('/api/dashboard');
    return response.data;
  },

  getRecentActivity: async () => {
    const response = await axios.get('/api/dashboard/activity');
    return response.data;
  }
};

// Servicios para archivos
export const fileService = {
  downloadFile: async (filePath) => {
    const response = await axios.get(`/api/files/download`, {
      params: { path: filePath },
      responseType: 'blob'
    });
    return response.data;
  },

  getFileUrl: (filePath) => {
    return `${API_BASE_URL}/uploads/${filePath}`;
  }
};

// Utilidades
export const apiUtils = {
  setAuthToken: (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  },

  handleApiError: (error) => {
    if (error.response) {
      // Error del servidor
      return error.response.data.error || 'Error del servidor';
    } else if (error.request) {
      // Error de red
      return 'Error de conexión';
    } else {
      // Error de configuración
      return 'Error inesperado';
    }
  }
};

const apiServices = {
  authService,
  statementService,
  paymentService,
  dashboardService,
  fileService,
  apiUtils
};

export default apiServices;
