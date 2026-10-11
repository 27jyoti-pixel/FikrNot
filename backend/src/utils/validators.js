const { body, param, query } = require('express-validator');
const { CATEGORIES, ROLES, MODERATION_ACTION, CLAIM_STATUS } = require('../constants');

const registerValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn([ROLES.STUDENT]).withMessage('Public registration is allowed for Student role only'),
  body('hostelId').isMongoId().withMessage('Valid Hostel ID is required'),
  body('studentId').notEmpty().withMessage('Student ID is required for student registration')
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const reportValidator = [
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('itemName').notEmpty().withMessage('Item name is required'),
  body('location').isObject().withMessage('Location is required'),
  body('location.area').trim().notEmpty().withMessage('Location area is required'),
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of [longitude, latitude]'),
  body('location.coordinates')
    .optional()
    .custom((coordinates) => {
      if (!Array.isArray(coordinates) || coordinates.length !== 2) return true;
      const [longitude, latitude] = coordinates.map(Number);
      return Number.isFinite(longitude) && Number.isFinite(latitude) &&
        Math.abs(longitude) <= 180 && Math.abs(latitude) <= 90;
    })
    .withMessage('Coordinates must be valid [longitude, latitude] values'),
  body('location.coordinates.*').optional().isNumeric().withMessage('Coordinates must be numeric')
];

const claimValidator = [
  body('foundReportId').isMongoId().withMessage('Valid Found Report ID is required'),
  body('evidence').notEmpty().withMessage('Claim evidence description is required')
];

const claimReviewValidator = [
  body('status').isIn([CLAIM_STATUS.UNDER_VERIFICATION, CLAIM_STATUS.APPROVED, CLAIM_STATUS.REJECTED]).withMessage('Status must be UNDER_VERIFICATION, APPROVED or REJECTED'),
  body('rejectionReason')
    .if(body('status').equals(CLAIM_STATUS.REJECTED))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting a claim')
];

const claimRequestInfoValidator = [
  body('infoRequestedReason').notEmpty().withMessage('Reason for requesting information is required')
];

const moderationValidator = [
  body('action').isIn(Object.values(MODERATION_ACTION)).withMessage(`Action must be one of: ${Object.values(MODERATION_ACTION).join(', ')}`),
  body('reason').notEmpty().withMessage('Moderation reason is required')
];

const userStatusValidator = [
  body('isActive').isBoolean().withMessage('isActive must be a boolean value')
];

const mongoIdParamValidator = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid Mongo ID in parameter '${paramName}'`)
];

module.exports = {
  registerValidator,
  loginValidator,
  reportValidator,
  claimValidator,
  claimReviewValidator,
  claimRequestInfoValidator,
  moderationValidator,
  userStatusValidator,
  mongoIdParamValidator
};
