const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse } = require('../utils/apiResponse');
const Match = require('../models/Match');
const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');

const getMatchesForLost = asyncWrapper(async (req, res) => {
  const lostReport = await LostReport.findById(req.params.lostReportId);

  if (!lostReport) {
    return res.status(404).json({
      success: false,
      message: 'Lost report not found'
    });
  }

  // Cancelled reports must not expose their matches.
  if (lostReport.cancellation?.isCancelled) {
    return res.status(404).json({
      success: false,
      message: 'Lost report not found'
    });
  }

  // Student can view matches only for their own lost report.
  if (
    req.user.role === 'student' &&
    lostReport.reportedBy.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can view matches for only your own lost report.'
    });
  }

  // Rector can view matches only for reports from assigned hostel.
  if (
    req.user.role === 'rector' &&
    lostReport.hostelId.toString() !== req.user.hostelId?.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Rector can view matches only for assigned hostel reports.'
    });
  }

  const matches = await Match.find({
    lostReportId: req.params.lostReportId
  })
    .populate({
      path: 'foundReportId',
      select: '-__v',
      match: {
        'cancellation.isCancelled': { $ne: true }
      },
      populate: {
        path: 'hostelId',
        select: 'name location'
      }
    })
    .sort({ matchScore: -1 });

  // Remove matches whose related Found report was cancelled.
  const validMatches = matches.filter((match) => match.foundReportId);

  return successResponse(
    res,
    200,
    'Matches retrieved successfully',
    validMatches
  );
});

const getMatchesForFound = asyncWrapper(async (req, res) => {
  const foundReport = await FoundReport.findById(req.params.foundReportId);

  if (!foundReport) {
    return res.status(404).json({
      success: false,
      message: 'Found report not found'
    });
  }

  // Cancelled reports must not expose their matches.
  if (foundReport.cancellation?.isCancelled) {
    return res.status(404).json({
      success: false,
      message: 'Found report not found'
    });
  }

  // Student can view matches only for their own found report.
  if (
    req.user.role === 'student' &&
    foundReport.reportedBy.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can view matches for only your own found report.'
    });
  }

  // Rector can view matches only for reports from assigned hostel.
  if (
    req.user.role === 'rector' &&
    foundReport.hostelId.toString() !== req.user.hostelId?.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Rector can view matches only for assigned hostel reports.'
    });
  }

  const matches = await Match.find({
    foundReportId: req.params.foundReportId
  })
    .populate({
      path: 'lostReportId',
      select: '-__v',
      match: {
        'cancellation.isCancelled': { $ne: true }
      },
      populate: {
        path: 'hostelId',
        select: 'name location'
      }
    })
    .sort({ matchScore: -1 });

  // Remove matches whose related Lost report was cancelled.
  const validMatches = matches.filter((match) => match.lostReportId);

  return successResponse(
    res,
    200,
    'Matches retrieved successfully',
    validMatches
  );
});

module.exports = {
  getMatchesForLost,
  getMatchesForFound
};