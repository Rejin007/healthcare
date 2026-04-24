import api from './api';

export const appointmentService = {
  getAll: async (page = 1, limit = 10, filters: Record<string, string> = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...filters,
    });
    const response = await api.get(`/appointments?${params}`);
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/appointments', data);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data;
  },
  getAvailableSlots: async (expertId: string, date: string) => {
    const response = await api.get(
      `/appointments/available-slots?expert_id=${expertId}&date=${encodeURIComponent(date)}`
    );
    return response.data;
  },
  updateMeetLink: async (id: string, meet_link: string) => {
    const response = await api.put(`/appointments/${id}/meet-link`, { meet_link });
    return response.data;
  },
};
