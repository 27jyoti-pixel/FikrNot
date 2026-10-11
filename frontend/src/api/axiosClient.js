import axios from "axios";
import { resolveApiBaseUrl } from "./apiBaseUrl";
const client = axios.create({
  baseURL: resolveApiBaseUrl(
    import.meta.env.VITE_API_URL,
    import.meta.env.DEV,
    typeof window === "undefined" ? "" : window.location.hostname,
  ),
  withCredentials: true,
});

// The API origin is public configuration. Logging it makes stale or misbuilt
// deployments diagnosable without exposing credentials or request data.
console.info("[FikrNot API] Base URL:", client.defaults.baseURL);

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("fikrnot_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
client.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem("fikrnot_token");
    }
    return Promise.reject(e);
  },
);
export const dataOf = (response) => response.data?.data ?? response.data;
export const listOf = (response) =>
  Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : [];
export const errorMessage = (e) => {
  if (e.response?.data?.message) return e.response.data.message;
  if (e.request) return "FikrNot could not reach the API. Check your connection and try again.";
  return e.message || "We couldn’t complete that request. Please try again.";
};
export default client;
