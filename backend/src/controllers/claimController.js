const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const claimService = require('../services/claims/claimService');

const submitClaim = asyncWrapper(async (req, res) => {
  const claim = await claimService.submitClaim(req.user, req.body);
  return successResponse(res, 201, 'Claim submitted successfully', claim);
});

const getMyClaims = asyncWrapper(async (req, res) => {
  const claims = await claimService.getStudentClaims(req.user);
  return successResponse(res, 200, 'User claims retrieved', claims);
});

const getRectorClaims = asyncWrapper(async (req, res) => {
  const result = await claimService.getRectorClaims(req.user, req.query);
  return paginatedResponse(
    res,
    200,
    'Hostel claims retrieved successfully',
    result.claims,
    result.pagination
  );
});

const getClaimById = asyncWrapper(async (req, res) => {
  const claim = await claimService.getClaimById(req.params.id, req.user);
  return successResponse(res, 200, 'Claim details retrieved', claim);
});

const updateEvidence = asyncWrapper(async (req, res) => {
  const claim = await claimService.updateClaimEvidence(req.params.id, req.user, req.body.evidence);
  return successResponse(res, 200, 'Claim evidence updated successfully', claim);
});

const withdrawClaim = asyncWrapper(async (req, res) => {
  const result = await claimService.withdrawClaim(req.params.id, req.user);
  return successResponse(res, 200, result.message);
});

const reviewClaim = asyncWrapper(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const claim = await claimService.reviewClaim(req.params.id, req.user, status, rejectionReason || '');
  return successResponse(res, 200, `Claim reviewed successfully (${status})`, claim);
});

const requestInformation = asyncWrapper(async (req, res) => {
  const { infoRequestedReason } = req.body;
  const claim = await claimService.requestMoreInfo(req.params.id, req.user, infoRequestedReason);
  return successResponse(res, 200, 'Additional information requested from claimant', claim);
});

module.exports = {
  submitClaim,
  getMyClaims,
  getRectorClaims,
  getClaimById,
  updateEvidence,
  withdrawClaim,
  reviewClaim,
  requestInformation
};
