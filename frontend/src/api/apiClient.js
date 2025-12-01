import axios from 'axios';

/**
 * Detecta automaticamente a URL base da API
 * PRIORIDADE: REACT_APP_API_URL > Detecção automática
 */
const getBaseURL = () => {
  // 1. PRIORIDADE MÁXIMA: Variável de ambiente
  if (process.env.REACT_APP_API_URL) {
    console.log('✅ Usando REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // 2. PRODUÇÃO: Detecta Render
  if (hostname === 'sorte-na-mao-frontend.onrender.com') {
    console.log('✅ Produção detectada (Render)');
    return 'https://sorte-na-mao-backend.onrender.com/api';
  }
  
  // 3. LOCALHOST: Desenvolvimento no computador
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('✅ Localhost detectado');
    return 'http://127.0.0.1:8000/api';
  }
  
  // 4. REDE LOCAL: Mobile na mesma Wi-Fi
  console.log('✅ Rede local detectada:', hostname);
  return `http://${hostname}:8000/api`;
};

const BASE_URL = getBaseURL();

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 segundos para cold start do Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log visível (importante para debug)
console.log('🌐 API Client configurado:', BASE_URL);

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
    
    // Log detalhado do erro
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      url: config?.url,
      baseURL: config?.baseURL,
      fullURL: config?.baseURL + config?.url,
      response: error.response?.data,
    });
    
    return Promise.reject(error);
  }
);

export default apiClient;
