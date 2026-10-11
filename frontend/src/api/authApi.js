import http, { dataOf } from "./axiosClient";
export const login = async (body) =>
  dataOf(await http.post("/auth/login", body));
export const loginDemoRector = async () =>
  dataOf(await http.post("/auth/demo-rector"));
export const getDemoRectorCredentials = async () =>
  dataOf(await http.get("/auth/demo-credentials"));
export const register = async (body) =>
  dataOf(await http.post("/auth/register", body));
export const getMe = async () => dataOf(await http.get("/auth/me"));
export const logout = () => http.post("/auth/logout");
