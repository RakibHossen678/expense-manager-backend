import { env } from '../config/env.js';
import { ApiError } from '../errors/ApiError.js';

/**
 * Converts Mongoose-specific errors into our ApiError shape so the final
 * handler below only ever deals with one error format.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error (e.g. required field missing, enum mismatch)
  if (err.name === 'ValidationError') {
    // If any field's ValidatorError has a `.reason` that is itself an
    // infrastructure/connection error (thrown inside our async custom
    // category validator when the Category DB lookup fails), treat this as
    // an unexpected server error, not a client input error. A 400 here
    // would confuse the user — their input might be perfectly valid.
    const hasInfrastructureFailure = Object.values(err.errors || {}).some(
      (ve) => ve.reason && !(ve.reason instanceof Error && ve.reason.name === 'ValidatorError')
    );
    if (hasInfrastructureFailure) {
      return new ApiError(503, 'A dependency is temporarily unavailable. Please try again.');
    }

    const details = Object.values(err.errors).map((e) => e.message);
    return new ApiError(400, 'Validation failed', details);
  }

  // Mongoose invalid ObjectId / cast error (e.g. malformed :id param)
  if (err.name === 'CastError') {
    return new ApiError(400, `Invalid value for field "${err.path}"`);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ApiError(409, `Duplicate value for "${field}"`);
  }

  return err;
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  const statusCode =
    normalized.statusCode && normalized.statusCode >= 100 && normalized.statusCode < 600
      ? normalized.statusCode
      : 500;

  const isUnexpected = !normalized.isOperational;

  if (isUnexpected) {
    console.error('Unexpected error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: isUnexpected ? 'Internal server error' : normalized.message,
    ...(normalized.details ? { errors: normalized.details } : {}),
    ...(env.NODE_ENV === 'development' && isUnexpected ? { stack: err.stack } : {}),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};
