import http, { dataOf, listOf } from "./axiosClient";
export const getProfile = async () => dataOf(await http.get("/users/me"));
export const getMyActivitySummary = async () => dataOf(await http.get("/users/me/activity"));
export const updateProfile = async (body) =>
  dataOf(await http.put("/users/me", body));
export const getUsers = async (params) =>
  listOf(await http.get("/users", { params }));
export const updateUserStatus = (id, isActive) =>
  http.put(`/users/${id}/status`, { isActive });
