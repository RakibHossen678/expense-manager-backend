import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

// Wraps user-supplied query values in $eq automatically, neutralizing
// NoSQL operator injection (e.g. ?field[$ne]=null) at the query-construction
// layer. This replaces the older express-mongo-sanitize middleware pattern,
// which is broken under Express 5 (req.query is now a read-only getter).
mongoose.set('sanitizeFilter', true);

// Fail queries immediately instead of buffering for up to 10s when
// disconnected. Set globally here AND reinforced per-schema in
// baseModelPlugin.js, since schema-level bufferCommands overrides both the
// global setting and the connect() option.
mongoose.set('bufferCommands', false);

// Single-user app — a small connection pool is more than sufficient and
// avoids holding open sockets the app will never use.
const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 5000, // fail fast on initial connect if DB is unreachable
  socketTimeoutMS: 45000, // kill inactive sockets after 45s
  maxPoolSize: 10,
  minPoolSize: 1,
  heartbeatFrequencyMS: 10000,
  family: 4, // skip IPv6 lookup attempt, connect via IPv4 directly
  bufferCommands: false, // fail queries immediately instead of buffering for 10s when disconnected
};

export const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGO_URI, CONNECTION_OPTIONS);
    console.log(`MongoDB connected`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Closes the Mongoose connection cleanly. Used during graceful shutdown so
 * in-flight queries finish before the process exits.
 */
export const disconnectDB = async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed.');
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message);
});

export default mongoose;
