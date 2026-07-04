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
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_TOKEN_EXPIRES_IN: process.env.AUTH_TOKEN_EXPIRES_IN || '7d',
  BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
  BREVO_SMTP_PORT: Number(process.env.BREVO_SMTP_PORT || 587),
  BREVO_SMTP_USER: process.env.BREVO_SMTP_USER || '',
  BREVO_SMTP_PASS: process.env.BREVO_SMTP_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'Expense Manager <no-reply@example.com>',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

if (!env.BREVO_SMTP_USER || !env.BREVO_SMTP_PASS) {
  console.warn(
    'Brevo SMTP env vars are missing. Password reset emails will not be sent until BREVO_SMTP_USER and BREVO_SMTP_PASS are configured.'
  );
}

// if (env.MAIL_FROM.includes('@gamil.com')) {
//   console.warn('MAIL_FROM appears to contain a typo. Verify that the sender address is correct and verified in Brevo.');
// }
