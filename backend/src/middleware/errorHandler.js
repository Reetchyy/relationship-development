import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error
  let error = {
    status: err.statusCode || 500,
    message: err.message || 'Internal Server Error'
  };

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error = {
          status: 409,
          message: 'Resource already exists'
        };
        break;
      case '23503': // Foreign key violation
        error = {
          status: 400,
          message: 'Invalid reference to related resource'
        };
        break;
      case '23514': // Check violation
        error = {
          status: 400,
          message: 'Data validation failed'
        };
        break;
      case 'PGRST116': // No rows found
        error = {
          status: 404,
          message: 'Resource not found'
        };
        break;
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      status: 400,
      message: 'Validation failed',
      details: err.details
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      status: 401,
      message: 'Invalid token'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      status: 401,
      message: 'Token expired'
    };
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
    delete error.details;
  }

  res.status(error.status).json({
    error: error.message,
    ...(error.details && { details: error.details }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
};