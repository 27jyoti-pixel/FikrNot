const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');
const { protect } = require('../middlewares/authMiddleware');
const { mongoIdParamValidator } = require('../utils/validators');
const { validate } = require('../middlewares/validationMiddleware');

router.get('/', hostelController.getHostels);
router.get('/me', protect, hostelController.getMyHostel);
router.get('/:id', protect, mongoIdParamValidator('id'), validate, hostelController.getHostelById);

module.exports = router;
