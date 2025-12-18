import axios from "axios";
import Constants from "expo-constants";
import { getToken } from "../utils/storage";

// Detecta el host del bundle de Expo (LAN/WiFi) para Expo Go.
const hostFromExpo = () => {
  const hostUri = Constants.expoConfig?.hostUri; // ej: "192.168.1.10:8081"
  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  return `http://${host}:3000`;
};

// Prioriza env, luego detección automática, luego localhost.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || hostFromExpo() || "http://localhost:3000";

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
