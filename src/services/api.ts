import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const cleanBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
const apiBase = cleanBaseUrl ? `${cleanBaseUrl}/api` : '/api';

export const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth errors (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
