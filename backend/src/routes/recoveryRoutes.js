const express = require('express');
const router = express.Router();
const recoveryController = require('../controllers/recoveryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { mongoIdParamValidator } = require('../utils/validators');
const { validate } = require('../middlewares/validationMiddleware');
const { ROLES } = require('../constants');

router.put('/:claimId/confirm', protect, authorize(ROLES.STUDENT), mongoIdParamValidator('claimId'), validate, recoveryController.confirmRecovery);
router.put('/:claimId/complete', protect, authorize(ROLES.RECTOR), mongoIdParamValidator('claimId'), validate, recoveryController.completeRecovery);

module.exports = router;
