import http, { listOf } from "./axiosClient";
export const getNotifications = async (params) => {
  const response = await http.get("/notifications", { params });
  return {
    notifications: listOf(response),
    unreadCount: response.data?.unreadCount ?? 0,
    pagination: response.data?.pagination ?? null,
  };
};
export const markRead = (id) => http.put(`/notifications/${id}/read`);
export const markAllRead = () => http.put("/notifications/read-all");
