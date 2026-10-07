const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse } = require('../utils/apiResponse');
const notificationService = require('../services/notifications/notificationService');

const getNotifications = asyncWrapper(async (req, res) => {
  const { notifications, unreadCount, pagination } =
    await notificationService.getUserNotifications(req.user, req.query);

  return res.status(200).json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: notifications,
    unreadCount,
    pagination
  });
});

const markAsRead = asyncWrapper(async (req, res) => {
  const notification = await notificationService.markNotificationAsRead(
    req.params.id,
    req.user
  );

  return successResponse(
    res,
    200,
    'Notification marked as read',
    notification
  );
});

const markAllAsRead = asyncWrapper(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user);

  return successResponse(res, 200, result.message);
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};