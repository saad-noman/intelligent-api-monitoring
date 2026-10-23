// Future home of all authentication logic: account creation, credential verification,
// session/token handling, and resolving the verified identity used by the auth middleware.
// The strategy (sessions, cookies, or tokens) has not been chosen yet.
import { NotImplementedError } from '../utils/errors.js';

export async function registerAccount(registration) {
  throw new NotImplementedError('authService.registerAccount');
}

export async function verifyCredentials(credentials) {
  throw new NotImplementedError('authService.verifyCredentials');
}

export async function endSession(authContext) {
  throw new NotImplementedError('authService.endSession');
}

// Returns the verified identity for a request, or null for guests.
export async function resolveRequestIdentity(req) {
  throw new NotImplementedError('authService.resolveRequestIdentity');
}

export async function getAccount(userId) {
  throw new NotImplementedError('authService.getAccount');
}
