require('dotenv').config();

const app = require('./src/app');
const { connectDB, disconnectDB } = require('./src/config/db');
const { runSeeds } = require('./src/services/seedService');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await runSeeds();

    const server = await new Promise((resolve, reject) => {
      const instance = app.listen(PORT, () => resolve(instance));
      instance.once('error', reject);
    });

    logger.info(`painting-backend listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        try {
          await disconnectDB();
          process.exit(0);
        } catch (err) {
          logger.error(`Shutdown failed: ${err.stack || err.message}`);
          process.exit(1);
        }
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    logger.error(`Failed to start server: ${err.stack || err.message}`);
    process.exit(1);
  }
}

start();

module.exports = app;
