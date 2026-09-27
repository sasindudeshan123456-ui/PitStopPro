import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("psp_token") || localStorage.getItem("psp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthError = err.response?.status === 401 || 
      (err.response?.status === 403 && (err.response?.data?.message?.toLowerCase().includes("token") || err.response?.data?.message?.toLowerCase().includes("permission")));
    if (isAuthError && window.location.pathname !== "/login") {
      sessionStorage.removeItem("psp_token");
      sessionStorage.removeItem("psp_user");
      localStorage.removeItem("psp_token");
      localStorage.removeItem("psp_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
