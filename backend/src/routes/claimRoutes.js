const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const {
  claimValidator,
  claimReviewValidator,
  claimRequestInfoValidator,
  mongoIdParamValidator
} = require('../utils/validators');
const { ROLES } = require('../constants');

router.post('/', protect, authorize(ROLES.STUDENT), claimValidator, validate, claimController.submitClaim);
router.get('/my', protect, authorize(ROLES.STUDENT), claimController.getMyClaims);
router.get('/rector', protect, authorize(ROLES.RECTOR), claimController.getRectorClaims);
router.get('/:id', protect, mongoIdParamValidator('id'), validate, claimController.getClaimById);
router.put('/:id/evidence', protect, authorize(ROLES.STUDENT), mongoIdParamValidator('id'), validate, claimController.updateEvidence);
router.put('/:id/withdraw', protect, authorize(ROLES.STUDENT), mongoIdParamValidator('id'), validate, claimController.withdrawClaim);
router.put('/:id/review', protect, authorize(ROLES.RECTOR), mongoIdParamValidator('id'), claimReviewValidator, validate, claimController.reviewClaim);
router.put(
  '/:id/request-information',
  protect,
  authorize(ROLES.RECTOR),
  mongoIdParamValidator('id'),
  claimRequestInfoValidator,
  validate,
  claimController.requestInformation
);

module.exports = router;
