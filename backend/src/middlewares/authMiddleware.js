const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { errorResponse } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(
        res,
        401,
        'Authentication token missing. Please log in.'
      );
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return errorResponse(
        res,
        401,
        'User no longer exists.'
      );
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        403,
        'Your account has been deactivated. Please contact your hostel Rector.'
      );
    }

    req.user = user;

    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return errorResponse(
        res,
        401,
        'Invalid or expired token. Please log in again.'
      );
    }

    return errorResponse(
      res,
      500,
      'Authentication service error.'
    );
  }
};

module.exports = {
  protect
};