import { create } from 'zustand';
import api from '../api/axios';
import { toast } from 'sonner';

const useUserStore = create((set, get) => ({
  executives: [],
  isLoading: false,

  fetchExecutives: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/admin/executives');
      if (response.success) {
        set({ executives: response.data });
      }
    } catch (error) {
      toast.error('Failed to fetch team members');
    } finally {
      set({ isLoading: false });
    }
  },

  addExecutive: async (userData) => {
    try {
      const response = await api.post('/admin/executives', userData);
      if (response.success) {
        toast.success('Executive added successfully');
        get().fetchExecutives();
        return true;
      }
    } catch (error) {
      toast.error(error.message || 'Failed to add executive');
      return false;
    }
  },

  deleteExecutive: async (id) => {
    try {
      const response = await api.delete(`/admin/executives/${id}`);
      if (response.success) {
        toast.success('Executive removed');
        get().fetchExecutives();
      }
    } catch (error) {
      toast.error('Failed to remove executive');
    }
  }
}));

export default useUserStore;
