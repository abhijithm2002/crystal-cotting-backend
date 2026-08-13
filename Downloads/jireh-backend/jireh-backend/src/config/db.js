const mongoose = require('mongoose');
const logger = require('./logger');

let memoryServer;

/**
 * Connects to MongoDB using the URI supplied via env.
 * Resolves once the connection is open.
 */
async function connectDB(uri) {
  let mongoUri = uri || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in the environment');
  }

  if (mongoUri === 'memory') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('The in-memory database cannot be used in production');
    }

    // Loaded only for the explicitly selected local mode so production
    // installations do not require mongodb-memory-server.
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
    logger.warn('Using temporary in-memory MongoDB; data will be lost when the server stops');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(mongoUri, {
    // Modern mongoose (8.x) no longer needs useNewUrlParser/useUnifiedTopology,
    // they are defaults, kept out intentionally.
  });

  logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  return conn;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
}

module.exports = { connectDB, disconnectDB };
