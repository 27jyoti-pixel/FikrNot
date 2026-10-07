import axios from "axios";
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});
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
export const errorMessage = (e) =>
  e.response?.data?.message ||
  "We couldn’t complete that request. Please try again.";
export default client;
