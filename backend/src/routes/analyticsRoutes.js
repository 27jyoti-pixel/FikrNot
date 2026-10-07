const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants');

router.get('/student', protect, authorize(ROLES.STUDENT), analyticsController.getStudentAnalytics);
router.get('/rector', protect, authorize(ROLES.RECTOR), analyticsController.getRectorAnalytics);

module.exports = router;
