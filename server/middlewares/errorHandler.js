const { APIError } = require('../utils/errors');

/**
 * Global Error Handler Middleware
 * Must be registered AFTER all routes in app.js
 * 
 * This middleware catches all errors thrown in controllers and formats them
 * according to the unified response format
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging
  process.env.NODE_ENV == "dev" && console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'dev' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    userId: req.user?._id
  });

  // Handle operational errors (expected errors thrown by our code)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: process.env.NODE_ENV === 'dev' ? err.details : undefined
      }
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const fields = {};
    Object.keys(err.errors).forEach(key => {
      fields[key] = err.errors[key].message;
    });

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fields
      }
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid ${err.path}: ${err.value}`
      }
    });
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'Value';
    return res.status(409).json({
      success: false,
      error: {
        code: field === 'email' ? 'EMAIL_EXISTS' : field === 'username' ? 'USERNAME_EXISTS' : 'DUPLICATE_ENTRY',
        message: `${field} already exists`,
        field
      }
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid authentication token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired'
      }
    });
  }

  // Handle Multer errors (file uploads)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      }
    });
  }

  // Programming errors or unknown errors (don't expose details in production)
  console.error('Unhandled error:', err);
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'dev' ? err.message : undefined
    }
  });
}

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors and pass them to the error handler
 * 
 * Usage: asyncHandler(async (req, res) => { ... })
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    // Return the promise so direct unit-test invocations (`await controller(req, res)`)
    // resolve only after the handler has responded or called next. Express itself
    // ignores the return value; errors are still routed to next() here.
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler
};
