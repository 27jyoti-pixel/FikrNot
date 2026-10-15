// The Rector endpoint's backend contract is the standard paginated envelope:
// Axios response -> body.data (claims array) and body.pagination (metadata).
export function normalizeRectorClaimsPage(response) {
  const body = response?.data;
  if (!body || !Array.isArray(body.data)) {
    throw new Error("Unexpected claims response: expected a paginated data array.");
  }
  if (!body.pagination || typeof body.pagination !== "object") {
    throw new Error("Unexpected claims response: pagination metadata is missing.");
  }
  const totalPages = Number(body.pagination.totalPages);
  if (!Number.isFinite(totalPages) || totalPages < 0) {
    throw new Error("Unexpected claims response: pagination totalPages is invalid.");
  }
  return { claims: body.data, pagination: { ...body.pagination, totalPages } };
}
