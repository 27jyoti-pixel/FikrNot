import http, { dataOf } from "./axiosClient";
export const login = async (body) =>
  dataOf(await http.post("/auth/login", body));
export const register = async (body) =>
  dataOf(await http.post("/auth/register", body));
export const getMe = async () => dataOf(await http.get("/auth/me"));
export const logout = () => http.post("/auth/logout");
