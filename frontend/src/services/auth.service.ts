import api from "./api";

export const authService = {
  // ── Admin: email + password ──────────────────────────────────────────────────
  adminLogin: async (email: string, password: string) => {
    const response = await api.post("/auth/admin/login", { email, password });
    return response.data;
  },

  // ── Patient: phone OTP ───────────────────────────────────────────────────────
  generateOTP: async (phone: string) => {
    const response = await api.post("/auth/generate-otp", { phone });
    return response.data;
  },

  verifyOTP: async (phone: string, otp: string) => {
    const response = await api.post("/auth/verify-otp", { phone, otp });
    return response.data;
  },

  // ── Shared ───────────────────────────────────────────────────────────────────
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};