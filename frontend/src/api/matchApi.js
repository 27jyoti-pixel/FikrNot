import http, { listOf } from "./axiosClient";
export const getMatchesForLost = async (id) =>
  listOf(await http.get(`/matches/lost/${id}`));
export const getMatchesForFound = async (id) =>
  listOf(await http.get(`/matches/found/${id}`));
