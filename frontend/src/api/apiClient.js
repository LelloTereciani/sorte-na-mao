import axios from 'axios';

/**
 * Cliente Axios pré-configurado para se comunicar com a nossa API back-end.
 * Usa variável de ambiente para permitir deploy em produção.
 */
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 10000, // Timeout de 10 segundos
});

export default apiClient;
