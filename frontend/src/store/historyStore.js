import { create } from 'zustand';
import api from '../api/axios';

const useHistoryStore = create((set, get) => ({
  history: [],
  isLoading: false,
  error: null,
  page: 0,
  hasMore: true,

  fetchHistory: async (isAdmin, pageNum = 0, append = false) => {
    set({ isLoading: true, error: null });
    try {
      const endpoint = isAdmin ? '/collections/history' : '/collections/my-history';
      const response = await api.get(endpoint, {
        params: { page: pageNum, size: 10 }
      });
      
      if (response.success) {
        const newData = response.data.content;
        set({
          history: append ? [...get().history, ...newData] : newData,
          page: pageNum,
          hasMore: !response.data.last,
          isLoading: false
        });
      }
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  deleteRecord: async (id) => {
    try {
      const response = await api.delete(`/collections/${id}`);
      if (response.success) {
        set({ history: get().history.filter(item => item.id !== id) });
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}));

export default useHistoryStore;
