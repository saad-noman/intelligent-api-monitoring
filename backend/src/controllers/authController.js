// Thin HTTP handlers for account access. Credential handling, session/token logic, and
// account persistence belong in services/authService.js, not here.
import { NotImplementedError } from '../utils/errors.js';

// POST /auth/register
export function register(req, res) {
  // TODO: Validate input and delegate account creation to authService.
  throw new NotImplementedError('POST /auth/register');
}

// POST /auth/login
export function login(req, res) {
  // TODO: Validate input and delegate credential verification to authService.
  throw new NotImplementedError('POST /auth/login');
}

// POST /auth/logout
export function logout(req, res) {
  // TODO: Delegate session/credential invalidation to authService.
  throw new NotImplementedError('POST /auth/logout');
}

// GET /auth/me (requireAuth)
export function getCurrentAccount(req, res) {
  // TODO: Return the account for req.user.id, including its separate alert-recipient email.
  throw new NotImplementedError('GET /auth/me');
}
