import { AppError } from '../utils/errors.js';

// Guards endpoints that expose or modify user-owned data (history, alerts, settings).
// Authorization is enforced here on the backend; frontend route guards are only UX.
export function requireAuth(req, res, next) {
  // TODO: Verify request credentials via authService and attach the verified identity to req.user.
  // Until verification exists, no request is ever treated as authenticated (fail closed).
  if (!req.user) {
    return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'));
  }
  next();
}
