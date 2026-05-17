import { create } from 'zustand';
import api from '../api/axios';

const useDashboardStore = create((set) => ({
  stats: {
    todayTarget: 0,
    todayCollected: 0,
    todayPending: 0,
  },
  teamPerformance: [],
  isLoading: false,
  error: null,

  fetchDashboardStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/dashboard');
      if (response.success) {
        set({ stats: response.data, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message || 'Failed to fetch dashboard stats', isLoading: false });
    }
  },

  fetchTeamPerformance: async () => {
    try {
      const response = await api.get('/admin/team-performance');
      if (response.success) {
        set({ teamPerformance: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch team performance', error);
    }
  }
}));

export default useDashboardStore;
