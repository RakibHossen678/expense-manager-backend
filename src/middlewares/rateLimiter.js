import rateLimit from 'express-rate-limit';

/**
 * General API rate limit. Generous because this is a single-user app —
 * the goal is blocking abuse/bots hitting a publicly reachable endpoint,
 * not throttling legitimate personal use.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/**
 * Stricter limit for write operations (create/update/delete), which are
 * more meaningful to throttle than reads.
 */
export const writeRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many write requests. Please slow down.',
  },
});
