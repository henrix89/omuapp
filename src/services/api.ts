import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Brukes sammen med proxy i vite.config.ts
  withCredentials: true,
});

export default api;
