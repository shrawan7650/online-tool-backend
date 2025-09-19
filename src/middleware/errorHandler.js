import { ZodError } from 'zod';
import pino from 'pino';

const logger = pino();

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(err, 'Unhandled error');

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors
      }
    });
    return;
  }

  // Handle MongoDB errors
  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    res.status(500).json({
      ok: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed'
      }
    });
    return;
  }

  // Handle duplicate key errors
  if (err.name === 'MongoServerError' && err.code === 11000) {
    res.status(409).json({
      ok: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Resource already exists'
      }
    });
    return;
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    ok: false,
    error: {
      code,
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : message
    }
  });
};
