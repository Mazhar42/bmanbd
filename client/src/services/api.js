import axios from "axios";
import useStore from "../store/useStore";

// In dev (MODE=development): use relative "/api" so Vite proxy forwards to VITE_API_URL
// In production (MODE=production): use absolute URL so the built app can reach the backend
const baseURL =
  import.meta.env.MODE === "production" && import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach token
api.interceptors.request.use(async (config) => {
  const token = useStore.getState().token;
  let csrfToken = useStore.getState().csrfToken;

  // For non-safe methods, ensure we have a CSRF token
  const isSafeMethod = ["get", "head", "options"].includes(
    config.method?.toLowerCase(),
  );

  if (!isSafeMethod && !csrfToken) {
    try {
      // Fetch a new token if we don't have one
      const { data } = await axios.get(`${baseURL}/auth/csrf`, {
        withCredentials: true,
      });
      csrfToken = data.csrfToken;
      useStore.getState().setCsrfToken(csrfToken);
    } catch (err) {
      console.error("Critical: Failed to fetch CSRF token", err);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (csrfToken && !config.headers["X-CSRF-Token"]) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const url = err.config?.url || "";
    const message = err.response?.data?.message || "";
    const originalRequest = err.config;

    const shouldAttemptRefresh =
      err.response?.status === 401 &&
      !originalRequest?._retry &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register") &&
      !url.includes("/auth/refresh") &&
      !url.includes("/auth/guest") &&
      !message.toLowerCase().includes("invalid email or password");

    if (shouldAttemptRefresh) {
      originalRequest._retry = true;
      try {
        const { data } = await api.post("/auth/refresh");
        useStore.getState().setUser(data.user, data.token);
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch {
        useStore.getState().logout();
      }
    }

    // Only force logout when the token itself is invalid/expired,
    // not for wrong-password or other auth errors on login endpoints.
    if (
      err.response?.status === 401 &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register") &&
      !message.toLowerCase().includes("invalid email or password")
    ) {
      useStore.getState().logout();
    }
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  getCsrfToken: () => api.get("/auth/csrf"),
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  guestRegister: (data) => api.post("/auth/guest", data),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  startOauth: (provider, data) =>
    api.post(`/auth/oauth/${provider}/start`, data),
  startOauthLink: (provider, data) =>
    api.post(`/auth/oauth/${provider}/link`, data),
  getMe: () => api.get("/auth/me"),
  updateMe: (data) => api.put("/auth/me", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  setPassword: (data) => api.put("/auth/set-password", data),
};

// ─── Products ─────────────────────────────────────────────────
export const productApi = {
  getAll: (params) => api.get("/products", { params }),
  getOne: (slugOrId) => api.get(`/products/${slugOrId}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  createVariant: (id, data) => api.post(`/products/${id}/variants`, data),
  updateVariant: (id, vid, data) =>
    api.put(`/products/${id}/variants/${vid}`, data),
  deleteVariant: (id, vid) => api.delete(`/products/${id}/variants/${vid}`),
  downloadTemplate: () =>
    api.get("/products/import/template", { responseType: "blob" }),
  importXlsx: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/products/import", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ─── Categories ────────────────────────────────────────────────
export const categoryApi = {
  getAll: () => api.get("/categories"),
  getTree: () => api.get("/categories/tree"),
  getOne: (slugOrId) => api.get(`/categories/${slugOrId}`),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ─── Orders ───────────────────────────────────────────────────
export const orderApi = {
  create: (data) => api.post("/orders", data),
  createPOS: (data) => api.post("/orders/pos", data),
  getMyOrders: () => api.get("/orders/my"),
  getAll: (params) => api.get("/orders", { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  delete: (id) => api.delete(`/orders/${id}`),
};

// ─── Inventory ────────────────────────────────────────────────
export const inventoryApi = {
  getAll: (params) => api.get("/inventory", { params }),
  getTransactions: (params) => api.get("/inventory/transactions", { params }),
  adjust: (data) => api.post("/inventory/adjust", data),
  purchase: (data) => api.post("/inventory/purchase", data),
  getAlerts: () => api.get("/inventory/alerts"),
  getStats: () => api.get("/inventory/stats"),
  deleteTransaction: (id) => api.delete(`/inventory/transactions/${id}`),
};

// ─── Users (Admin) ────────────────────────────────────────────
export const userApi = {
  getAll: (params) => api.get("/users", { params }),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  getDashboardStats: () => api.get("/users/dashboard-stats"),
  delete: (id) => api.delete(`/users/${id}`),
};

// ─── Site Settings (CMS-like config) ────────────────────────
export const settingsApi = {
  getPublic: () => api.get("/settings/public"),
  getAdmin: () => api.get("/settings"),
  update: (data) => api.put("/settings", data),
};

// ─── Media ───────────────────────────────────────────────────
export const mediaApi = {
  uploadImage: (file, folder) => {
    const formData = new FormData();
    formData.append("image", file);
    if (folder) formData.append("folder", folder);
    return api.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default api;
