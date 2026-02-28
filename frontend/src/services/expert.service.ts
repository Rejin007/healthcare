import api from './api';

export const expertService = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const response = await api.get(`/experts?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/experts/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/experts', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/experts/${id}`, data);
    return response.data;
  }
};
