import axios from "axios";
import { getMockResponse } from "./mockData";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("psp_token") || localStorage.getItem("psp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let toastShown = false;

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // If local backend is offline or network fails (e.g. Vercel Mixed Content block)
    const isNetworkError = !err.response || err.code === "ERR_NETWORK" || err.message?.includes("Network Error");
    
    if (isNetworkError) {
      if (!toastShown && window.location.pathname === "/login") {
        toast.success("Demo Mode Activated: Displaying sample data!", { id: "demo-mode" });
        toastShown = true;
      }
      
      const config = err.config || {};
      const mockData = getMockResponse(config.url || "", config.method || "get", config.data ? JSON.parse(config.data || "{}") : {});
      
      return Promise.resolve({
        data: mockData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: config
      });
    }

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
  }
);

export default api;
