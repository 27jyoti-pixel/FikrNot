const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');
const User = require('../models/User');
const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');
const Claim = require('../models/Claim');
const { ROLES, STUDENT_SHIFTS, LOST_STATUS, FOUND_STATUS, CLAIM_STATUS } = require('../constants');
const moderationService = require('../services/moderation/moderationService');

const getMyProfile = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('hostelId', 'name location capacity');

  return successResponse(res, 200, 'Profile retrieved', { user });
});

const updateMyProfile = asyncWrapper(async (req, res) => {
  const allowedFields = [
    'name',
    'phone',
    'address',
    'emergencyContact',
    'parentGuardian',
    'roomNumber',
    'course',
    'department',
    'designation'
  ];

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  let parentGuardianValue;
  if (req.body.parentGuardian !== undefined) {
    try {
      parentGuardianValue = typeof req.body.parentGuardian === 'string'
        ? JSON.parse(req.body.parentGuardian)
        : req.body.parentGuardian;
    } catch {
      return res.status(400).json({ success: false, message: 'Parent or guardian details are invalid.' });
    }
    if (!parentGuardianValue || typeof parentGuardianValue !== 'object' || Array.isArray(parentGuardianValue)) {
      return res.status(400).json({ success: false, message: 'Parent or guardian details are invalid.' });
    }
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = field === 'parentGuardian' ? parentGuardianValue : req.body[field];
    }
  });

  if (req.body.shift !== undefined && req.body.shift !== '') {
    if (user.role !== ROLES.STUDENT || !STUDENT_SHIFTS.includes(req.body.shift)) {
      return res.status(400).json({ success: false, message: 'Please select a valid student shift.' });
    }
    user.shift = req.body.shift;
  }

  if (req.uploadedImages && req.uploadedImages.length > 0) {
    user.profileImage = req.uploadedImages[0].url;
  }

  await user.save();

  return successResponse(res, 200, 'Profile updated successfully', { user });
});

const getMyActivitySummary = asyncWrapper(async (req, res) => {
  const ownerId = req.user._id;
  const activeLostStatuses = [LOST_STATUS.RECOVERED, LOST_STATUS.CLOSED];
  const inactiveFoundStatuses = [FOUND_STATUS.RETURNED, FOUND_STATUS.CLOSED];
  const pendingClaimStatuses = [CLAIM_STATUS.SUBMITTED, CLAIM_STATUS.UNDER_VERIFICATION, CLAIM_STATUS.APPROVED];
  const [lostReports, foundReports, recoveredReports, recoveredClaims, pendingClaims, activeLost, activeFound] = await Promise.all([
    LostReport.countDocuments({ reportedBy: ownerId }),
    FoundReport.countDocuments({ reportedBy: ownerId }),
    LostReport.countDocuments({ reportedBy: ownerId, status: LOST_STATUS.RECOVERED }),
    Claim.countDocuments({ claimantId: ownerId, studentConfirmedAt: { $ne: null } }),
    Claim.countDocuments({ claimantId: ownerId, status: { $in: pendingClaimStatuses } }),
    LostReport.countDocuments({ reportedBy: ownerId, status: { $nin: activeLostStatuses }, 'cancellation.isCancelled': { $ne: true } }),
    FoundReport.countDocuments({ reportedBy: ownerId, status: { $nin: inactiveFoundStatuses }, 'cancellation.isCancelled': { $ne: true } })
  ]);
  return successResponse(res, 200, 'Activity summary retrieved', { summary: {
    reportsSubmitted: lostReports + foundReports,
    itemsRecovered: recoveredReports + recoveredClaims,
    pendingClaims,
    activeReports: activeLost + activeFound
  } });
});

const getUsers = asyncWrapper(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Rector can view only students belonging to the assigned hostel.
  const filter = {
    hostelId: req.user.hostelId,
    role: ROLES.STUDENT
  };

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { studentId: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const total = await User.countDocuments(filter);

  const users = await User.find(filter)
    .select(
      'name email phone studentId course department year semester hostelId roomNumber isActive profileImage createdAt updatedAt'
    )
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  return paginatedResponse(res, 200, 'Users retrieved successfully', users, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  });
});

const getUserById = asyncWrapper(async (req, res) => {
  const targetUser = await User.findById(req.params.id);

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const isSelf = req.user._id.toString() === req.params.id;

  // Rector can view only users from the assigned hostel.
  if (
    req.user.role === ROLES.RECTOR &&
    req.user.hostelId?.toString() !== targetUser.hostelId?.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Rector can view only assigned hostel students.'
    });
  }

  let query = User.findById(req.params.id).select('-password');

  if (!isSelf) {
    // Another user's private information must not be exposed.
    query = query.select(
      '-parentGuardian -emergencyContact -address -roomNumber -phone'
    );
  }

  const user = await query.populate('hostelId', 'name location');

  return successResponse(res, 200, 'User details retrieved', { user });
});

const updateUserStatus = asyncWrapper(async (req, res) => {
  const { isActive } = req.body;

  const updatedUser = await moderationService.updateUserStatusByRector(
    req.params.id,
    req.user,
    isActive
  );

  return successResponse(
    res,
    200,
    `Student account status set to ${isActive ? 'Active' : 'Inactive'}`,
    { user: updatedUser }
  );
});

module.exports = {
  getMyProfile,
  getMyActivitySummary,
  updateMyProfile,
  getUsers,
  getUserById,
  updateUserStatus
};
