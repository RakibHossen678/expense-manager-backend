/**
 * Wraps an async controller/middleware function so any thrown error or
 * rejected promise is forwarded to next(), landing in errorHandler.js.
 *
 * Express 5 does this automatically for async route handlers, but we keep
 * this explicit wrapper for clarity, consistency with existing project
 * conventions, and to make the intent obvious at every call site.
 *
 * Usage:
 *   export const getAllIncome = asyncHandler(async (req, res) => { ... });
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
