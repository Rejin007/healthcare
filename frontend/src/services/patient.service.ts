import api from './api';

export const patientService = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const response = await api.get(`/patients?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/patients', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/patients/stats');
    return response.data;
  },
  sendOTPEmail: async (patientId: string) => {
    const response = await api.post(`/patients/${patientId}/send-otp-email`);
    return response.data;
  },
};
