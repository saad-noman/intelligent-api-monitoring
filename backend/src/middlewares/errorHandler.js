import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

// Client-safe errors for request bodies rejected by express.json(), keyed by err.type.
const BODY_PARSER_ERRORS = {
  'entity.parse.failed': () => new AppError(400, 'INVALID_JSON', 'The request body is not valid JSON.'),
  'entity.too.large': () => new AppError(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large.'),
};

function toClientError(err) {
  const create = BODY_PARSER_ERRORS[err.type];
  return create ? create() : err;
}

// Centralized error responses: { error: { code, message } }. Only the application's own
// client-safe errors (AppError) reveal their message; other details and stack traces are
// added in development only.
export function createErrorHandler({ isProduction }) {
  // Express identifies error handlers by their four-argument signature.
  return function errorHandler(originalError, req, res, next) {
    const err = toClientError(originalError);
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
    if (exposeMessage && err.details !== undefined) body.error.details = err.details;
    if (!isProduction && !exposeMessage) {
      body.error.detail = err.message;
      body.error.stack = err.stack;
    }

    res.status(status).json(body);
  };
}
