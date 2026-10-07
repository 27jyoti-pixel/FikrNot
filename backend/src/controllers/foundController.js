const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const foundService = require('../services/found/foundService');
const moderationService = require('../services/moderation/moderationService');

const createFound = asyncWrapper(async (req, res) => {
  const report = await foundService.createFoundReport(req.user, req.body, req.uploadedImages || []);
  return successResponse(res, 201, 'Found report created successfully', report);
});

const getFound = asyncWrapper(async (req, res) => {
  const { reports, pagination } = await foundService.getFoundReports(req.user, req.query);
  return paginatedResponse(res, 200, 'Found reports retrieved successfully', reports, pagination);
});

const getFoundById = asyncWrapper(async (req, res) => {
  const report = await foundService.getFoundReportById(req.params.id, req.user);
  return successResponse(res, 200, 'Found report details retrieved', report);
});

const updateFound = asyncWrapper(async (req, res) => {
  const report = await foundService.updateFoundReport(req.params.id, req.user, req.body, req.uploadedImages || []);
  return successResponse(res, 200, 'Found report updated successfully', report);
});

const receiveFoundItem = asyncWrapper(async (req, res) => {
  const report = await foundService.receiveFoundItemByRector(req.params.id, req.user);
  return successResponse(res, 200, 'Physical custody of found item confirmed by Rector', report);
});

const updateFoundStatus = asyncWrapper(async (req, res) => {
  const { status } = req.body;
  const report = await foundService.updateFoundStatusByRector(req.params.id, req.user, status);
  return successResponse(res, 200, `Found report status updated to ${status}`, report);
});

const cancelFound = asyncWrapper(async (req, res) => {
  const report = await foundService.cancelFoundReport(req.params.id, req.user);
  return successResponse(res, 200, 'Found report cancelled successfully', report);
});

const deleteFound = asyncWrapper(async (req, res) => {
  const result = await foundService.deleteFoundReport(req.params.id, req.user);
  return successResponse(res, 200, result.message);
});

const moderateFound = asyncWrapper(async (req, res) => {
  const { action, reason } = req.body;
  const report = await moderationService.moderateFoundReport(req.params.id, req.user, action, reason);
  return successResponse(res, 200, `Found report moderated successfully (${action})`, report);
});

module.exports = {
  createFound,
  getFound,
  getFoundById,
  updateFound,
  receiveFoundItem,
  updateFoundStatus,
  cancelFound,
  deleteFound,
  moderateFound
};
