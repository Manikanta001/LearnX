import axios from 'axios';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.PROD) {
    return '/api';
  }
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiBase(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Crucial to send refresh token cookie to backend
});

// Attach custom JWT access token and x-test-app header to each request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Auto-persist query parameter to localStorage for persistence across client-side navigations
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('mode')) {
        const mode = urlParams.get('mode');
        if (mode === 'test') {
          localStorage.setItem('isTestApp', 'true');
        } else if (mode === 'real') {
          localStorage.setItem('isTestApp', 'false');
        }
      }
    }
    
    // Determine if the app is in test mode
    const isTestApp = 
      import.meta.env.VITE_IS_TEST_APP === 'true' || 
      (typeof window !== 'undefined' && (
        window.location.port === '3001' || 
        window.location.hostname.includes('test') ||
        localStorage.getItem('isTestApp') === 'true'
      ));
    
    config.headers['x-test-app'] = isTestApp ? 'true' : 'false';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept 401 errors to refresh access token silently
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('[API Interceptor] Token expired. Fetching refresh token...');
        const testHeader = originalRequest.headers['x-test-app'] || 'false';
        
        // Request a new access token
        const refreshResponse = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, {
          withCredentials: true, // send the HTTPOnly cookie
          headers: {
            'x-test-app': testHeader
          }
        });
        
        const { accessToken } = refreshResponse.data;
        console.log('[API Interceptor] Token refreshed successfully.');
        
        // Save the new access token
        localStorage.setItem('accessToken', accessToken);
        
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API Interceptor] Silent refresh failed. Logging out...', refreshError);
        localStorage.removeItem('accessToken');
        // If we are in the browser, redirect to login page
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
