import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const requiredEnvVars = ['MONGO_URI', 'AUTH_SECRET'];

const missing = requiredEnvVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  // Fail fast and loudly — a misconfigured DB connection string causing a
  // silent crash deep inside Mongoose is much harder to debug than this.
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_TOKEN_EXPIRES_IN: process.env.AUTH_TOKEN_EXPIRES_IN || '7d',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};
