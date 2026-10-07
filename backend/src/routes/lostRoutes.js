const express = require('express');
const router = express.Router();
const lostController = require('../controllers/lostController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { upload, handleImageUpload } = require('../middlewares/uploadMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { reportValidator, moderationValidator, mongoIdParamValidator } = require('../utils/validators');
const { ROLES } = require('../constants');

router.post(
  '/',
  protect,
  authorize(ROLES.STUDENT),
  upload.array('images', 5),
  handleImageUpload,
  reportValidator,
  validate,
  lostController.createLost
);

router.get('/', protect, lostController.getLost);
router.get('/:id', protect, mongoIdParamValidator('id'), validate, lostController.getLostById);

router.put(
  '/:id',
  protect,
  upload.array('images', 5),
  handleImageUpload,
  mongoIdParamValidator('id'),
  validate,
  lostController.updateLost
);

router.put('/:id/cancel', protect, authorize(ROLES.STUDENT), mongoIdParamValidator('id'), validate, lostController.cancelLost);
router.delete('/:id', protect, authorize(ROLES.STUDENT), mongoIdParamValidator('id'), validate, lostController.deleteLost);

router.put(
  '/:id/moderate',
  protect,
  authorize(ROLES.RECTOR),
  mongoIdParamValidator('id'),
  moderationValidator,
  validate,
  lostController.moderateLost
);

module.exports = router;
