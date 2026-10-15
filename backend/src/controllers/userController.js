const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/apiResponse');
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
  if (req.user.role !== ROLES.STUDENT) {
    return errorResponse(res, 403, 'Only students can update their own profile details.');
  }

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
  if (!req.user.hostelId) {
    return errorResponse(res, 403, 'Rector must have an assigned hostel to view students.');
  }
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
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
  if (req.query.course) filter.course = req.query.course;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.year && Number.isFinite(Number(req.query.year))) {
    filter.year = Number(req.query.year);
  }
  if (req.query.isActive === 'true' || req.query.isActive === 'false') {
    filter.isActive = req.query.isActive === 'true';
  }

  const total = await User.countDocuments(filter);
  const sortBy = req.query.sortBy === 'createdAt' ? 'createdAt' : 'name';
  const sortDirection = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = sortBy === 'name'
    ? { name: 1 }
    : { createdAt: sortDirection, _id: sortDirection };

  const users = await User.find(filter)
    .select(
      'name email phone studentId course department year semester hostelId roomNumber isActive profileImage createdAt updatedAt'
    )
    .sort(sort)
    .skip(skip)
    .limit(limit);

  return paginatedResponse(res, 200, 'Users retrieved successfully', users, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1
  });
});

const getRectorStudentSummary = asyncWrapper(async (req, res) => {
  if (!req.user.hostelId) {
    return errorResponse(res, 403, 'Rector must have an assigned hostel to view student totals.');
  }
  const filter = { hostelId: req.user.hostelId, role: ROLES.STUDENT };
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const [total, newThisMonth, courses, departments, years] = await Promise.all([
    User.countDocuments(filter),
    User.countDocuments({ ...filter, createdAt: { $gte: monthStart, $lt: nextMonth } }),
    User.distinct('course', filter),
    User.distinct('department', filter),
    User.distinct('year', filter)
  ]);
  return successResponse(res, 200, 'Hostel student summary retrieved', {
    total,
    newThisMonth,
    courses: courses.filter(Boolean).sort(),
    departments: departments.filter(Boolean).sort(),
    years: years.filter((year) => Number.isFinite(Number(year))).sort((a, b) => Number(a) - Number(b))
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
    (!req.user.hostelId || targetUser.role !== ROLES.STUDENT ||
      req.user.hostelId?.toString() !== targetUser.hostelId?.toString())
  ) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Rector can view only assigned hostel students.'
    });
  }

  let query = User.findById(req.params.id).select('-password');

  if (!isSelf) {
    // Rectors need contact and room details for students in their assigned
    // hostel; guardian, emergency-contact, and address details remain private.
    // Other cross-user profile reads continue to omit those fields as well.
    const privateFields = req.user.role === ROLES.RECTOR
      ? '-parentGuardian -emergencyContact -address'
      : '-parentGuardian -emergencyContact -address -roomNumber -phone';
    query = query.select(privateFields);
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
  getRectorStudentSummary,
  getUserById,
  updateUserStatus
};
