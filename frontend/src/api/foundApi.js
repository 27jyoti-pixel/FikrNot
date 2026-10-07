import http, { dataOf } from "./axiosClient";
const formData = (data) => {
  const f = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (k === "images") v.forEach((x) => f.append("images", x));
    else if (k === "removeImageIds") f.append("removeImageIds", JSON.stringify(v));
    else if (k === "location") {
      f.append("location[area]", v.area);
      v.coordinates?.forEach((n, i) =>
        f.append(`location[coordinates][${i}]`, n),
      );
    } else f.append(k, v);
  });
  return f;
};
export const getFound = async (params) => http.get("/found", { params });
export const getFoundItem = async (id) =>
  dataOf(await http.get(`/found/${id}`));
export const createFound = async (data) =>
  dataOf(await http.post("/found", formData(data)));
export const updateFound = async (id, data) =>
  dataOf(await http.put(`/found/${id}`, formData(data)));
export const receiveFound = (id) => http.put(`/found/${id}/receive`);
export const updateFoundStatus = (id, status) =>
  http.put(`/found/${id}/status`, { status });
export const cancelFound = (id) => http.put(`/found/${id}/cancel`);
export const moderateFound = (id, body) =>
  http.put(`/found/${id}/moderate`, body);
