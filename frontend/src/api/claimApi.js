import http, { dataOf, listOf } from "./axiosClient";
export { normalizeRectorClaimsPage } from "./claimResponse.js";
export const createClaim = async (body) =>
  dataOf(await http.post("/claims", body));
export const getMyClaims = async () => listOf(await http.get("/claims/my"));
export const getRectorClaims = (params) => http.get("/claims/rector", { params });
// The rector endpoint uses the standard paginated API envelope: Axios response
// -> body.data (claims array) and body.pagination (metadata).
export const getClaim = async (id) => dataOf(await http.get(`/claims/${id}`));
export const updateEvidence = (id, evidence) =>
  http.put(`/claims/${id}/evidence`, { evidence });
export const withdrawClaim = (id) => http.put(`/claims/${id}/withdraw`);
export const reviewClaim = (id, body) => http.put(`/claims/${id}/review`, body);
export const requestInformation = (id, infoRequestedReason) =>
  http.put(`/claims/${id}/request-information`, { infoRequestedReason });
