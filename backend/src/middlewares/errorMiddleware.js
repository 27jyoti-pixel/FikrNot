const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.statusCode
    ? err.message
    : 'Internal Server Error';
  let errors = [];

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';

    errors = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message
    }));
  }

  // MongoDB duplicate key
  else if (err.code === 11000) {
    statusCode = 409;

    const fields = Object.keys(err.keyValue || {});

    message = fields.length > 0
      ? `Duplicate value already exists for: ${fields.join(', ')}.`
      : 'Duplicate resource already exists.';
  }

  // Invalid MongoDB ObjectId
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID.';
  }

  // Multer file size limit
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size exceeds the maximum allowed limit of 5MB.';
  }

  // Multer maximum number of files
  else if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = 'Maximum number of files exceeded.';
  }

  // Multer unexpected field
  else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field.';
  }

  // Invalid file type from uploadMiddleware
  else if (
    err.message &&
    err.message.startsWith('Invalid file type.')
  ) {
    statusCode = 400;
    message = err.message;
  }

  // JWT-related errors
  else if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError'
  ) {
    statusCode = 401;
    message = 'Invalid or expired authentication token.';
  }

  // Error messages and stacks can contain user input or connection strings.
  // Keep logs useful with safe codes and request context only.
  console.error(JSON.stringify({
    event: 'api_request_error',
    method: req.method,
    path: req.path,
    statusCode,
    errorName: err.name || 'Error',
    diagnosticCode: err.diagnosticCode || undefined,
    errorCode: typeof err.code === 'string' || typeof err.code === 'number'
      ? err.code
      : undefined,
    causeName: err.cause?.name || undefined,
    causeCode: typeof err.cause?.code === 'string' || typeof err.cause?.code === 'number'
      ? err.cause.code
      : undefined
  }));

  return errorResponse(
    res,
    statusCode,
    message,
    errors.length > 0 ? errors : undefined
  );
};

module.exports = errorHandler;
