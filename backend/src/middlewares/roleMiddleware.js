const { ROLES } = require('../constants');
const { errorResponse } = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'User not authenticated.');
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Role '${req.user.role}' is not authorized for this endpoint.`
      );
    }

    next();
  };
};

const verifyRectorHostelScope = (req, res, targetHostelId) => {
  if (req.user.role !== ROLES.RECTOR) {
    return false;
  }
  if (!req.user.hostelId) {
    return false;
  }
  if (!targetHostelId) {
    return false;
  }
  return req.user.hostelId.toString() === targetHostelId.toString();
};

module.exports = {
  authorize,
  verifyRectorHostelScope
};
