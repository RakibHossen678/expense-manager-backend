import helmet from 'helmet';

/**
 * This API never serves HTML, so CSP/script-src directives are irrelevant
 * noise — disable them and keep the headers that matter for a JSON API:
 * MIME-sniffing protection, clickjacking protection, and HSTS.
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow the frontend (different origin) to fetch responses
});
