/**
 * Starts the complete API with a temporary local MongoDB instance.
 * This is intended for development and demos when MongoDB is not installed.
 */
process.env.MONGODB_URI = 'memory';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

require('../server');
