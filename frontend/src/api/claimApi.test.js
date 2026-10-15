import assert from "node:assert/strict";
import test from "node:test";
import { normalizeRectorClaimsPage } from "./claimResponse.js";

test("normalizes the backend paginated Rector claims envelope", () => {
  const claims = [{ _id: "claim-1" }];
  const pagination = { page: 1, limit: 100, total: 1, totalPages: 1 };
  assert.deepEqual(
    normalizeRectorClaimsPage({ data: { success: true, data: claims, pagination } }),
    { claims, pagination },
  );
});

test("accepts a valid empty paginated claims response", () => {
  assert.deepEqual(
    normalizeRectorClaimsPage({
      data: { success: true, data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } },
    }),
    { claims: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } },
  );
});

test("rejects unexpected claim and pagination shapes visibly", () => {
  assert.throws(
    () => normalizeRectorClaimsPage({ data: { data: { claims: [] }, pagination: { totalPages: 1 } } }),
    /expected a paginated data array/,
  );
  assert.throws(
    () => normalizeRectorClaimsPage({ data: { data: [], pagination: { totalPages: "bad" } } }),
    /totalPages is invalid/,
  );
});
