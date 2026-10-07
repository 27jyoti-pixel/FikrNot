import http from "./axiosClient";
export const confirmRecovery = (id) => http.put(`/recovery/${id}/confirm`);
export const completeRecovery = (id) => http.put(`/recovery/${id}/complete`);
