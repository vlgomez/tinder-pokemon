import axios from "axios";
import { getToken } from "../utils/storage";

// 🔴 IMPORTANTE: ajusta según dónde ejecutes la app
// Android emulator → http://10.0.2.2:3000
// iOS simulator → http://localhost:3000
// Móvil físico → http://TU_IP_LOCAL:3000
const BASE_URL = "http://192.168.1.36:3000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
