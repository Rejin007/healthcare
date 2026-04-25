import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// ── Public routes that should never trigger a login redirect on 401 ───────────
const PUBLIC_ROUTE_PREFIXES = [
  "/appointments/available-slots",
  "/auth/generate-otp",
  "/auth/verify-otp",
  "/experts/public",
];

const isPublicRoute = (url: string = ""): boolean =>
  PUBLIC_ROUTE_PREFIXES.some((prefix) => url.includes(prefix));

// ── Cookie reader ─────────────────────────────────────────────────────────────
const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
};

// ── Token resolver — checks localStorage, then sessionStorage, then cookie ───
// BUG FIX: was missing sessionStorage check — session-only logins had no token sent
const getToken = (): string | null =>
  localStorage.getItem("accessToken") ||
  sessionStorage.getItem("accessToken") ||
  getCookie("nila_token");

// ── Clear all session data ────────────────────────────────────────────────────
// BUG FIX: exported so App.tsx logout can reuse the same full-wipe logic
export const clearSession = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");
  // Match the same SameSite=Strict that setCookie() uses in Login.tsx
  document.cookie = "nila_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
  document.cookie = "nila_user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict";
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// ── Attach JWT token automatically (only if present) ──────────────────────────
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
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? "";
    if (
      error.response?.status === 401 &&
      !isRedirecting &&
      !isPublicRoute(url)
    ) {
      isRedirecting = true;
      clearSession();
      setTimeout(() => {
        window.location.href = "/login";
        isRedirecting = false;
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Unauthenticated client for public self-registration ───────────────────────
// POST /patients is an admin-protected route on the backend.
// During the public booking flow no user token exists yet, so we attach a
// lightweight service token (VITE_SERVICE_TOKEN) that grants just enough
// permission to create a patient record.  If no service token is configured
// the header is omitted and the backend will return its normal auth error.
const SERVICE_TOKEN = import.meta.env.VITE_SERVICE_TOKEN as string | undefined;

export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    ...(SERVICE_TOKEN ? { Authorization: `Bearer ${SERVICE_TOKEN}` } : {}),
  },
  timeout: 60000,
});
