import { create } from 'zustand';
import api from '../api/axios';

const useCustomerStore = create((set, get) => ({
  customers: [],
  currentPage: 0,
  totalPages: 0,
  isLoading: false,
  error: null,

  fetchCustomers: async (page = 0, size = 10, search = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/customers', {
        params: { page, size, search }
      });
      if (response.success) {
        set({ 
          customers: response.data.content,
          currentPage: response.data.number,
          totalPages: response.data.totalPages,
          isLoading: false 
        });
      }
    } catch (error) {
      set({ error: error.message || 'Failed to fetch customers', isLoading: false });
    }
  },

  recordCollection: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/collections', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.success) {
        set({ isLoading: false });
        return { success: true };
      }
    } catch (error) {
      set({ error: error.message || 'Failed to record collection', isLoading: false });
      return { success: false, error: error.message };
    }
  },
  
  deleteCustomer: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      if (response.success) {
        set({ customers: get().customers.filter(c => c.id !== id) });
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}));

export default useCustomerStore;
