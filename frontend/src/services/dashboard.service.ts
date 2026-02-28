import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getTopExperts: async (limit = 10) => {
    const response = await api.get(`/dashboard/top-experts?limit=${limit}`);
    return response.data;
  },
  getRecentAppointments: async (limit = 10) => {
    const response = await api.get(`/dashboard/recent-appointments?limit=${limit}`);
    return response.data;
  }
};
