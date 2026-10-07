const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { protect } = require('../middlewares/authMiddleware');
const { mongoIdParamValidator } = require('../utils/validators');
const { validate } = require('../middlewares/validationMiddleware');

router.get('/lost/:lostReportId', protect, mongoIdParamValidator('lostReportId'), validate, matchController.getMatchesForLost);
router.get('/found/:foundReportId', protect, mongoIdParamValidator('foundReportId'), validate, matchController.getMatchesForFound);

module.exports = router;
