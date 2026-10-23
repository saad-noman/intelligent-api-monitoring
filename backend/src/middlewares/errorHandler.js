import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

// Centralized error responses: { error: { code, message } }. Only the application's own
// client-safe errors (AppError) reveal their message; other details and stack traces are
// added in development only.
export function createErrorHandler({ isProduction }) {
  // Express identifies error handlers by their four-argument signature.
  return function errorHandler(err, req, res, next) {
    const rawStatus = err.status ?? err.statusCode;
    const status = Number.isInteger(rawStatus) && rawStatus >= 400 && rawStatus <= 599 ? rawStatus : 500;
    const exposeMessage = err instanceof AppError;

    if (status >= 500 && status !== 501) {
      logger.error(`Unhandled error: ${err.name}: ${err.message}`);
    }

    const body = {
      error: {
        code: exposeMessage ? err.code : status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR',
        message: exposeMessage ? err.message : status >= 500 ? 'Internal server error.' : 'Invalid request.',
      },
    };
    if (!isProduction && !exposeMessage) {
      body.error.detail = err.message;
      body.error.stack = err.stack;
    }

    res.status(status).json(body);
  };
}
