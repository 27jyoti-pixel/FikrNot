const LostReport = require('../../models/LostReport');
const FoundReport = require('../../models/FoundReport');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const { ROLES, NOTIFICATION_TYPES, MODERATION_ACTION } = require('../../constants');

const moderateLostReport = async (reportId, rector, action, reason) => {
  const report = await LostReport.findById(reportId);
  if (!report) {
    const error = new Error('Lost report not found');
    error.statusCode = 404;
    throw error;
  }

  // Assigned hostel check
  if (report.hostelId.toString() !== rector.hostelId.toString()) {
    const error = new Error('Access denied. Rector can moderate reports only for assigned hostel.');
    error.statusCode = 403;
    throw error;
  }

  report.moderation = {
    isFlagged: action !== MODERATION_ACTION.NONE,
    action,
    reason,
    moderatedBy: rector._id,
    moderatedAt: new Date()
  };

  await report.save();

  // Notify student
  await Notification.create({
    userId: report.reportedBy,
    type: NOTIFICATION_TYPES.REPORT_MODERATED,
    title: 'Report Moderation Notice',
    message: `Your lost report "${report.itemName}" has been moderated by Rector (${action}). Reason: ${reason}`,
    relatedId: report._id
  });

  return report;
};

const moderateFoundReport = async (reportId, rector, action, reason) => {
  const report = await FoundReport.findById(reportId);
  if (!report) {
    const error = new Error('Found report not found');
    error.statusCode = 404;
    throw error;
  }

  if (report.hostelId.toString() !== rector.hostelId.toString()) {
    const error = new Error('Access denied. Rector can moderate reports only for assigned hostel.');
    error.statusCode = 403;
    throw error;
  }

  report.moderation = {
    isFlagged: action !== MODERATION_ACTION.NONE,
    action,
    reason,
    moderatedBy: rector._id,
    moderatedAt: new Date()
  };

  await report.save();

  await Notification.create({
    userId: report.reportedBy,
    type: NOTIFICATION_TYPES.REPORT_MODERATED,
    title: 'Report Moderation Notice',
    message: `Your found report "${report.itemName}" has been moderated by Rector (${action}). Reason: ${reason}`,
    relatedId: report._id
  });

  return report;
};

const updateUserStatusByRector = async (targetUserId, rector, isActive) => {
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Rule 29: Rector CANNOT deactivate another Rector!
  if (targetUser.role === ROLES.RECTOR) {
    const error = new Error('Access denied. Rector cannot modify status of another Rector.');
    error.statusCode = 403;
    throw error;
  }

  // Rule 29: Rector can modify status of students in assigned hostel only
  if (!targetUser.hostelId || targetUser.hostelId.toString() !== rector.hostelId.toString()) {
    const error = new Error('Access denied. Rector can manage student account status only within assigned hostel.');
    error.statusCode = 403;
    throw error;
  }

  targetUser.isActive = isActive;
  await targetUser.save();

  // Send Notification to student if active/inactive
  await Notification.create({
    userId: targetUser._id,
    type: NOTIFICATION_TYPES.ACCOUNT_STATUS_CHANGED,
    title: 'Account Status Updated',
    message: `Your account status has been updated to: ${isActive ? 'Active' : 'Inactive'} by your Hostel Rector.`
  });

  return targetUser;
};

module.exports = {
  moderateLostReport,
  moderateFoundReport,
  updateUserStatusByRector
};
