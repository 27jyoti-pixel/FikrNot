import http, { dataOf, listOf } from "./axiosClient";
export const getHostels = async () => listOf(await http.get("/hostels"));
export const getMyHostel = async () => dataOf(await http.get("/hostels/me"));
