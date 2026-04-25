import api from './api';

// ── Normalize slot/appointment list responses ─────────────────────────────────
// The backend may return { slots: [...] }, { data: { slots: [...] } },
// { appointments: [...] }, or { data: { appointments: [...] } }.
function unwrap<T>(res: any, key: string): T[] {
  if (!res) return [];
  // Direct key at root: { slots: [...] }
  if (Array.isArray(res[key])) return res[key];
  // Wrapped once: { data: { slots: [...] } }
  if (res.data && Array.isArray(res.data[key])) return res.data[key];
  // Wrapped twice: { data: { data: { slots: [...] } } }  (some backends double-wrap)
  if (res.data?.data && Array.isArray(res.data.data[key])) return res.data.data[key];
  // The response itself is the array
  if (Array.isArray(res)) return res as T[];
  // BUG FIX: backend may return { success, data: [...] } where data IS the array
  if (res.data && Array.isArray(res.data)) return res.data as T[];
  return [];
}

export const appointmentService = {
  // Bug fix: filters typed as Record<string,any>; uses explicit .set() loop
  // so URLSearchParams never receives undefined/null.
  getAll: async (page = 1, limit = 10, filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
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

  // Bug fix: normalise response → always returns { slots: [...] }.
  // The shared api instance skips 401-redirect for this public route
  // (see PUBLIC_ROUTE_PREFIXES in api.ts), so unauthenticated users can load slots.
  getAvailableSlots: async (expertId: string, date: string) => {
    const response = await api.get(
      `/appointments/available-slots?expert_id=${expertId}&date=${encodeURIComponent(date)}`
    );
    const slots = unwrap<any>(response.data, 'slots');
    return { slots };
  },

  // Bug fix: dedicated helper uses 'status' (singular, not 'statuses') as the
  // query param, and returns a plain array so callers don't guess the shape.
  getAppointmentsByUser: async (
    userId: string,
    expertId: string,
    statuses: string[]
  ): Promise<any[]> => {
    const params = new URLSearchParams({
      page:      '1',
      limit:     '100',
      user_id:   userId,
      expert_id: expertId,
      status:    statuses.join(','),
    });
    const response = await api.get(`/appointments?${params}`);
    return unwrap<any>(response.data, 'appointments');
  },

  updateMeetLink: async (id: string, meet_link: string) => {
    const response = await api.put(`/appointments/${id}/meet-link`, { meet_link });
    return response.data;
  },
};
