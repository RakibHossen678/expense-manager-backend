import express from 'express';
import compression from 'compression';

import { corsMiddleware } from './middlewares/cors.js';
import { securityHeaders } from './middlewares/securityHeaders.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import apiRoutes from './routes/index.js';

const app = express();

// Trust the first proxy hop (needed for correct req.ip behind a reverse
// proxy / load balancer in production, which rate limiting depends on).
app.set('trust proxy', 1);

// Security headers, tuned for a JSON API
app.use(securityHeaders);

// CORS
app.use(corsMiddleware);

// Gzip compression — meaningful win on mobile networks
app.use(compression());

// Request logging
app.use(requestLogger);

// Body parsing — 1mb is generous headroom for this app's payloads
// (income/expense entries are small JSON objects, never file uploads)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting — applied at the API boundary, before routes
app.use('/api', apiRateLimiter);

// API routes
app.use('/api', apiRoutes);

// 404 handler — must come after all routes
app.use(notFoundHandler);

// Centralized error handler — must be registered last
app.use(errorHandler);

export default app;
