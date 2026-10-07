const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse } = require('../utils/apiResponse');
const analyticsService = require('../services/analytics/analyticsService');

const getStudentAnalytics = asyncWrapper(async (req, res) => {
  const analytics = await analyticsService.getStudentCampusAnalytics();
  return successResponse(res, 200, 'Campus-wide analytics retrieved', analytics);
});

const getRectorAnalytics = asyncWrapper(async (req, res) => {
  const analytics = await analyticsService.getRectorHostelAnalytics(req.user.hostelId);
  return successResponse(res, 200, 'Assigned hostel analytics retrieved', analytics);
});

module.exports = {
  getStudentAnalytics,
  getRectorAnalytics
};
