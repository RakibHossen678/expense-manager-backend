/**
 * Sends a consistent success response shape across every module:
 *   { success: true, message, data }
 *
 * Usage in a controller:
 *   sendResponse(res, 200, 'Income fetched', incomeList);
 */
export const sendResponse = (res, statusCode, message, data = null, meta = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null ? { data } : {}),
    ...(meta !== null ? { meta } : {}),
  });
};
