import { create } from 'zustand';
import api from '../api/axios';

const useAnalyticsStore = create((set) => ({
  overview: null,
  trend: [],
  paymentModes: [],
  highRisk: [],
  performance: [],
  isLoading: false,
  error: null,

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/overview');
      if (response.success) {
        set({ overview: response.data, isLoading: false });
      }
    } catch (error) {
      set({ error: error.message || 'Failed to fetch overview', isLoading: false });
    }
  },

  fetchTrend: async (range = 'week') => {
    try {
      const response = await api.get(`/analytics/trend?range=${range}`);
      if (response.success) {
        set({ trend: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch trend', error);
    }
  },

  fetchPaymentModes: async () => {
    try {
      const response = await api.get('/analytics/payment-modes');
      if (response.success) {
        set({ paymentModes: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch payment modes', error);
    }
  },

  fetchHighRisk: async () => {
    try {
      const response = await api.get('/analytics/high-risk');
      if (response.success) {
        set({ highRisk: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch high risk customers', error);
    }
  },

  fetchPerformance: async () => {
    try {
      const response = await api.get('/analytics/performance');
      if (response.success) {
        set({ performance: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch performance', error);
    }
  }
}));

export default useAnalyticsStore;
