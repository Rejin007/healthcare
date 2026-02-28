import api from './api';

export const paymentService = {
  getAll: async (page = 1, limit = 20, status = '') => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'all') params.append('status', status);
    const response = await api.get(`/payments?${params}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/payments/stats');
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/payments/${id}/status`, { status });
    return response.data;
  },
};
