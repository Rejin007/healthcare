import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// ── Cookie reader ─────────────────────────────────────────────────────────────
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

// ── Token resolver — checks localStorage first, then cookie ──────────────────
const getToken = (): string | null =>
  localStorage.getItem("accessToken") || getCookie("nila_token");

// ── Clear all session data ────────────────────────────────────────────────────
const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");
  // clear cookies
  document.cookie = "nila_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "nila_user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// ── Attach JWT token automatically ────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    if (config.method === "post" || config.method === "put") {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Handle 401 — clear session and redirect to login ─────────────────────────
let isRedirecting = false; // prevent redirect loop

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      clearSession();
      // Small delay so any in-flight requests can settle
      setTimeout(() => {
        window.location.href = "/login";
        isRedirecting = false;
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default api;