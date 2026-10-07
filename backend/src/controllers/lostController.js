const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const lostService = require('../services/lost/lostService');
const moderationService = require('../services/moderation/moderationService');

const createLost = asyncWrapper(async (req, res) => {
  const report = await lostService.createLostReport(req.user, req.body, req.uploadedImages || []);
  return successResponse(res, 201, 'Lost report created successfully', report);
});

const getLost = asyncWrapper(async (req, res) => {
  const { reports, pagination } = await lostService.getLostReports(req.user, req.query);
  return paginatedResponse(res, 200, 'Lost reports retrieved successfully', reports, pagination);
});

const getLostById = asyncWrapper(async (req, res) => {
  const report = await lostService.getLostReportById(req.params.id, req.user);
  return successResponse(res, 200, 'Lost report details retrieved', report);
});

const updateLost = asyncWrapper(async (req, res) => {
  const report = await lostService.updateLostReport(req.params.id, req.user, req.body, req.uploadedImages || []);
  return successResponse(res, 200, 'Lost report updated successfully', report);
});

const cancelLost = asyncWrapper(async (req, res) => {
  const report = await lostService.cancelLostReport(req.params.id, req.user);
  return successResponse(res, 200, 'Lost report cancelled successfully', report);
});

const deleteLost = asyncWrapper(async (req, res) => {
  const result = await lostService.deleteLostReport(req.params.id, req.user);
  return successResponse(res, 200, result.message);
});

const moderateLost = asyncWrapper(async (req, res) => {
  const { action, reason } = req.body;
  const report = await moderationService.moderateLostReport(req.params.id, req.user, action, reason);
  return successResponse(res, 200, `Lost report moderated successfully (${action})`, report);
});

module.exports = {
  createLost,
  getLost,
  getLostById,
  updateLost,
  cancelLost,
  deleteLost,
  moderateLost
};
