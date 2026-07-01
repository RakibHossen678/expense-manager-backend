/**
 * Operational error class. Throw this from controllers/services whenever
 * a request should fail with a specific status code and message, e.g.:
 *
 *   throw new ApiError(404, 'Income entry not found');
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
