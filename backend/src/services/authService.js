// All authentication logic: account creation, credential verification, session
// handling, and resolving the verified identity used by the auth middlewares.
// Strategy: opaque bearer tokens backed by server-side sessions stored in MongoDB.
import { getConfig } from '../config/env.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { AppError } from '../utils/errors.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken, hashToken, getBearerToken } from '../utils/token.js';
import { toAccount } from './userService.js';

const MONGO_DUPLICATE_KEY = 11000;
const MS_PER_HOUR = 60 * 60 * 1000;

// One message for "no such user" and "wrong password" so neither case is revealed.
function invalidCredentialsError() {
  return new AppError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.');
}

function sessionExpiryDate() {
  return new Date(Date.now() + getConfig().sessionTtlHours * MS_PER_HOUR);
}

function incorrectPasswordError() {
  return new AppError(403, 'INCORRECT_PASSWORD', 'The current password is incorrect.');
}

// Turns MongoDB's duplicate-email error into a client-safe 409; other errors pass through.
function toEmailTakenError(error) {
  if (error.code === MONGO_DUPLICATE_KEY) {
    return new AppError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }
  return error;
}

// Loads the user with their password hash, or throws 404.
async function findUserWithPassword(userId) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.');
  return user;
}

export async function registerAccount({ firstName, lastName, email, password }) {
  const passwordHash = await hashPassword(password);
  try {
    const user = await User.create({ firstName, lastName, email, passwordHash });
    return toAccount(user);
  } catch (error) {
    throw toEmailTakenError(error);
  }
}

// Used before sensitive account changes. Returns the user document; throws 403 on a wrong password.
export async function confirmPassword(userId, password) {
  const user = await findUserWithPassword(userId);
  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) throw incorrectPasswordError();
  return user;
}

// Changes the login email after the current password is confirmed.
export async function changeEmail(userId, { currentPassword, email }) {
  const user = await confirmPassword(userId, currentPassword);
  user.email = email;
  try {
    await user.save();
  } catch (error) {
    throw toEmailTakenError(error);
  }
  return toAccount(user);
}

// Changes the password after the current password is confirmed.
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await confirmPassword(userId, currentPassword);
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}

// Logs the user out everywhere, e.g. when the account is deleted.
export async function endAllSessions(userId) {
  await Session.deleteMany({ userId });
}

// Returns the account when the email and password match; otherwise throws 401.
export async function verifyCredentials({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw invalidCredentialsError();

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentialsError();

  return toAccount(user);
}

// Creates a session and returns the plain token. This is the only place it is returned.
export async function startSession(userId) {
  const token = generateToken();
  const expiresAt = sessionExpiryDate();
  await Session.create({ userId, tokenHash: hashToken(token), expiresAt });
  return { token, expiresAt };
}

// Deletes the session for the request's token, if any. Safe to call without a token.
export async function endSession(req) {
  const token = getBearerToken(req);
  if (!token) return;
  await Session.deleteOne({ tokenHash: hashToken(token) });
}

// Returns the verified identity for a request ({ id }), or null for guests.
export async function resolveRequestIdentity(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  const session = await Session.findOne({
    tokenHash: hashToken(token),
    // The TTL index removes expired sessions periodically, not instantly, so check here too.
    expiresAt: { $gt: new Date() },
  }).lean();
  if (!session) return null;

  return { id: session.userId.toString() };
}
