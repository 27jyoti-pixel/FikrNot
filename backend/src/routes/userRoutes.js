const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const { upload, handleImageUpload } = require('../middlewares/uploadMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { userStatusValidator, mongoIdParamValidator } = require('../utils/validators');
const { ROLES } = require('../constants');

router.get('/me', protect, userController.getMyProfile);
router.put('/me', protect, upload.single('profileImage'), handleImageUpload, userController.updateMyProfile);

router.get('/', protect, authorize(ROLES.RECTOR), userController.getUsers);
router.get('/:id', protect, mongoIdParamValidator('id'), validate, userController.getUserById);
router.put('/:id/status', protect, authorize(ROLES.RECTOR), mongoIdParamValidator('id'), userStatusValidator, validate, userController.updateUserStatus);

module.exports = router;
