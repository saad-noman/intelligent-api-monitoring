// Thin HTTP handlers for account access. Credential handling, session logic, and
// account persistence live in services/authService.js.
import * as authService from '../services/authService.js';
import { getAccount } from '../services/userService.js';
import { parseEmail, parseName, parsePassword, parseNewPassword } from '../utils/validation.js';

// POST /auth/register
export async function register(req, res) {
  const { firstName, lastName, email, password } = req.body ?? {};
  const account = await authService.registerAccount({
    firstName: parseName(firstName, 'First name'),
    lastName: parseName(lastName, 'Last name'),
    email: parseEmail(email),
    password: parseNewPassword(password),
  });
  res.status(201).json({ account });
}

// POST /auth/login
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  const account = await authService.verifyCredentials({
    email: parseEmail(email),
    password: parsePassword(password),
  });
  const { token, expiresAt } = await authService.startSession(account.id);
  res.json({ token, expiresAt, account });
}

// POST /auth/logout
export async function logout(req, res) {
  await authService.endSession(req);
  res.status(204).end();
}

// GET /auth/me (requireAuth)
export async function getCurrentAccount(req, res) {
  const account = await getAccount(req.user.id);
  res.json({ account });
}
