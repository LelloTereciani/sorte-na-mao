import axios from 'axios';

/**
 * Cliente Axios pré-configurado para se comunicar com a nossa API back-end.
 * Usa variável de ambiente para permitir deploy em produção.
 */
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 60000, // 60 segundos para cold start do Render
});

// Interceptor para retry automático em caso de timeout
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const config = error.config;
    
    // Se foi timeout e ainda não tentou retry
    if (error.code === 'ECONNABORTED' && !config._retry) {
      config._retry = true;
      console.log('⏱️ Timeout detectado. Tentando novamente...');
      
      // Aumenta o timeout para 90s no retry
      config.timeout = 90000;
      return apiClient(config);
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
