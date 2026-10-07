const Notification = require('../../models/Notification');

const getUserNotifications = async (user, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = { userId: user._id };
  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === 'true';
  }

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const unreadCount = await Notification.countDocuments({ userId: user._id, isRead: false });

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

const markNotificationAsRead = async (notificationId, user) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  if (notification.userId.toString() !== user._id.toString()) {
    const error = new Error('Access denied. You can modify only your own notifications.');
    error.statusCode = 403;
    throw error;
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

const markAllNotificationsAsRead = async (user) => {
  await Notification.updateMany(
    { userId: user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return { message: 'All notifications marked as read' };
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
