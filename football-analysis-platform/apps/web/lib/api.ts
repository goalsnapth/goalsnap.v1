import axios from "axios";

// Create an Axios instance configured for the backend
const api = axios.create({
  baseURL: "http://localhost:8000", // Python Backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add an interceptor to include the token in requests automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;