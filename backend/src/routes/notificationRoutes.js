const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');
const { mongoIdParamValidator } = require('../utils/validators');
const { validate } = require('../middlewares/validationMiddleware');

router.get('/', protect, notificationController.getNotifications);
router.put('/read-all', protect, notificationController.markAllAsRead);
router.put('/:id/read', protect, mongoIdParamValidator('id'), validate, notificationController.markAsRead);

module.exports = router;
