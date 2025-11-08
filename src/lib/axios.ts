import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Add user headers for audit logging (client-side only)
    if (typeof window !== 'undefined') {
      const { user } = useAuthStore.getState();
      
      if (user) {
        // Ensure headers object exists
        if (!config.headers) {
          config.headers = {};
        }
        
        // Add user information headers for audit logging
        config.headers['x-user-id'] = user.id;
        config.headers['x-user-fullname'] = user.fullName;
        config.headers['x-user-email'] = user.email;
        config.headers['x-user-role'] = user.role;
        if (user.departmentId) {
          config.headers['x-user-department-id'] = user.departmentId;
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      // Clear auth storage and redirect to login
      if (typeof window !== 'undefined') {
        // Clear the auth storage
        window.localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
