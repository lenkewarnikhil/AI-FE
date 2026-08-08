import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const cleanBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
export const API_BASE_URL = cleanBaseUrl ? `${cleanBaseUrl}/api` : '/api';

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export const getFileUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (cleanPath.startsWith('/api/')) {
    return `${API_BASE_URL}${cleanPath.slice(4)}`;
  }
  return `${API_BASE_URL}${cleanPath}`;
};

export const api = axios.create({
  baseURL: API_BASE_URL,
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
