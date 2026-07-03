import cors from 'cors';

// Keep the allowlist in code so multiple frontend origins can be added
// directly without relying on a comma-separated env var.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin "${origin}" not allowed by CORS`));
  },
  credentials: true,
});
