import { logger } from '../utils/logger.js';

// Logs method, path (query string excluded), status, and duration only. Headers, bodies,
// and client identifiers are deliberately never logged.
export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const path = req.originalUrl.split('?')[0];

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    logger.info(`${req.method} ${path} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
  });
  next();
}
