import http, { dataOf, listOf } from "./axiosClient";
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
export const getLost = async (params) => http.get("/lost", { params });
export const getLostItem = async (id) => dataOf(await http.get(`/lost/${id}`));
export const createLost = async (data) =>
  dataOf(await http.post("/lost", formData(data)));
export const updateLost = async (id, data) =>
  dataOf(await http.put(`/lost/${id}`, formData(data)));
export const cancelLost = (id) => http.put(`/lost/${id}/cancel`);
export const moderateLost = (id, body) =>
  http.put(`/lost/${id}/moderate`, body);
