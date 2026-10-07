import http, { listOf } from "./axiosClient";
export const getNotifications = async (params) =>
  listOf(await http.get("/notifications", { params }));
export const markRead = (id) => http.put(`/notifications/${id}/read`);
export const markAllRead = () => http.put("/notifications/read-all");
