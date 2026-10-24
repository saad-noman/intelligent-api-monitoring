// Rejects requests without a valid session token. On success, req.user is the verified
// identity ({ id }) resolved from server-side session data, never from client-supplied IDs.
import { resolveRequestIdentity } from '../services/authService.js';
import { AppError } from '../utils/errors.js';

export async function requireAuth(req, res, next) {
  req.user = await resolveRequestIdentity(req);
  if (!req.user) {
    return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'));
  }
  next();
}
