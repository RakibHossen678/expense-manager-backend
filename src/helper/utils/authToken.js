import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../../errors/ApiError.js';

const TOKEN_HEADER = { alg: 'HS256', typ: 'JWT' };

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');

const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const parseDurationMs = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const match = /^(\d+)([smhd])$/.exec(String(value).trim());
  if (!match) {
    throw new ApiError(500, 'Invalid auth token expiration configuration');
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

export const createAuthToken = ({ userId, tokenVersion }) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresInMs = parseDurationMs(env.AUTH_TOKEN_EXPIRES_IN);
  const payload = {
    sub: String(userId),
    tokenVersion,
    iat: issuedAt,
    exp: issuedAt + Math.floor(expiresInMs / 1000),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(TOKEN_HEADER));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', env.AUTH_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyAuthToken = (token) => {
  try {
    const [encodedHeader, encodedPayload, signature] = String(token || '').split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new ApiError(401, 'Authentication required');
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.AUTH_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new ApiError(401, 'Invalid authentication token');
    }

    const header = JSON.parse(base64UrlDecode(encodedHeader));
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new ApiError(401, 'Invalid authentication token');
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      throw new ApiError(401, 'Authentication token expired');
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, 'Invalid authentication token');
  }
};
