import app from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { env } from './src/config/env.js';

const SHUTDOWN_TIMEOUT_MS = 10000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  let isShuttingDown = false;

  const gracefulShutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received. Shutting down gracefully...`);

    // Force-exit if shutdown hangs (e.g. a stuck keep-alive socket), so the
    // process never lingers indefinitely.
    const forceExitTimer = setTimeout(() => {
      console.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await disconnectDB();
      } catch (error) {
        console.error('Error closing MongoDB connection:', error.message);
      } finally {
        clearTimeout(forceExitTimer);
        process.exit(0);
      }
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // A rejected promise with no .catch() anywhere — log it, don't crash.
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });

  // A thrown error with no try/catch anywhere — this leaves the process in
  // an undefined state, so we log clearly and shut down deliberately rather
  // than letting Node crash with a raw, unstructured stack trace.
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    gracefulShutdown('uncaughtException');
  });
};

startServer();
