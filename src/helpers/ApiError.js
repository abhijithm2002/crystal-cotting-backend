/**
 * Standard application error carrying an HTTP status code.
 * Thrown/passed-to-next anywhere in the app; caught by the centralized
 * error handler in src/middleware/errorHandler.js.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
