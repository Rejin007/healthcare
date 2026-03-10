import api from "./api";

export const authService = {
  adminLogin: async (email: string, password: string) => {
    const response = await api.post("/auth/admin/login", {
      email,
      password,
    });

    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};