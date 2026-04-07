import axios from 'axios';
import { cacheApiResponse, getCachedApiResponse, addToSyncQueue } from './offlineStore';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the Token in every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration and OFFLINE CACHING
api.interceptors.response.use(
  async (response) => {
    // Cache GET requests
    if (response.config.method === 'get') {
      await cacheApiResponse(response.config.url, response.data);
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;

    // Handle 401 Unauthorized
    if (response && response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle Network Error (Offline)
    if (!response) {
      if (config.method === 'get') {
        const cachedData = await getCachedApiResponse(config.url);
        if (cachedData) {
          toast.success("Using cached data (Offline)", { id: 'offline-get' });
          return { data: cachedData, status: 200, config, headers: {}, request: {} };
        }
      } else if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        // Queue mutations
        await addToSyncQueue(config.url, config.method, config.data);
        toast.success("Action saved locally. Will sync when online.", { 
            icon: '📦',
            duration: 4000,
            id: 'offline-mutation' 
        });
        // Return a mock success so UI doesn't crash/show error
        return { data: { message: "Offline success", offline: true }, status: 200 };
      }
    }

    return Promise.reject(error);
  }
);

export default api;
