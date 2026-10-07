const express = require('express');
const router = express.Router();
const foundController = require('../controllers/foundController');
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
  foundController.createFound
);

router.get('/', protect, foundController.getFound);
router.get('/:id', protect, mongoIdParamValidator('id'), validate, foundController.getFoundById);

router.put(
  '/:id',
  protect,
  upload.array('images', 5),
  handleImageUpload,
  mongoIdParamValidator('id'),
  validate,
  foundController.updateFound
);

router.put('/:id/receive', protect, authorize(ROLES.RECTOR), mongoIdParamValidator('id'), validate, foundController.receiveFoundItem);
router.put('/:id/status', protect, authorize(ROLES.RECTOR), mongoIdParamValidator('id'), validate, foundController.updateFoundStatus);
router.put('/:id/cancel', protect, authorize(ROLES.STUDENT), mongoIdParamValidator('id'), validate, foundController.cancelFound);
router.delete('/:id', protect, authorize(ROLES.STUDENT), mongoIdParamValidator('id'), validate, foundController.deleteFound);

router.put(
  '/:id/moderate',
  protect,
  authorize(ROLES.RECTOR),
  mongoIdParamValidator('id'),
  moderationValidator,
  validate,
  foundController.moderateFound
);

module.exports = router;
