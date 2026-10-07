import http, { dataOf } from "./axiosClient";
export const getStudentAnalytics = async () =>
  dataOf(await http.get("/analytics/student"));
export const getRectorAnalytics = async () =>
  dataOf(await http.get("/analytics/rector"));
