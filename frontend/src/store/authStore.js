import { create } from 'zustand';
import api from '../api/axios';
import { v4 as uuidv4 } from 'uuid';

const getDeviceId = () => {
  let id = localStorage.getItem('deviceId');
  if (!id) {
    id = `device_${uuidv4()}`;
    localStorage.setItem('deviceId', id);
  }
  return id;
};

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  deviceId: getDeviceId(),
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
  },
  isExecutive: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role === 'ROLE_EXECUTIVE' || user?.role === 'EXECUTIVE';
  },
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.success) {
        const { token, ...userData } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
    } catch (error) {
      set({ 
        error: error.message || 'Login failed. Please check your credentials.', 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  quickLogin: async (username) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/quick-login', { username });
      
      if (response.success) {
        const { token, ...userData } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true };
      }
    } catch (error) {
      set({ 
        error: error.message || 'Quick login failed.', 
        isLoading: false 
      });
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
