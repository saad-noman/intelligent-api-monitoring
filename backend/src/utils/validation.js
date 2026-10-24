// Input validation helpers. Each parser returns a normalized value or throws a
// client-safe 400 error naming the problem (never echoing the submitted value).
import { AppError } from './errors.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

function validationError(message) {
  return new AppError(400, 'VALIDATION_ERROR', message);
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw validationError(`${label} is required.`);
  }
  return value;
}

// Emails are trimmed and lower-cased so the same address always matches one account.
export function parseEmail(value, label = 'Email') {
  const email = requireString(value, label).trim().toLowerCase();
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw validationError(`${label} must be a valid email address.`);
  }
  return email;
}

// For login: only checks that a password was supplied.
export function parsePassword(value) {
  const password = requireString(value, 'Password');
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw validationError(`Password must be at most ${PASSWORD_MAX_LENGTH} characters.`);
  }
  return password;
}

// For registration: also enforces the minimum length.
export function parseNewPassword(value) {
  const password = parsePassword(value);
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw validationError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  }
  return password;
}
