// Account settings. Owns the alert-recipient email preference, which is separate from
// the account's registration/login email.
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';

// The account fields that are safe to send to the client.
export function toAccount(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    alertEmail: user.alertEmail ?? null,
    createdAt: user.createdAt,
  };
}

async function findUserOrThrow(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'Account not found.');
  return user;
}

export async function getAccount(userId) {
  const user = await findUserOrThrow(userId);
  return toAccount(user);
}

// Returns the saved alert-recipient email, or null if none is saved.
export async function getAlertEmail(userId) {
  const user = await findUserOrThrow(userId);
  return user.alertEmail ?? null;
}

export async function updateAlertEmail(userId, alertEmail) {
  const user = await findUserOrThrow(userId);
  user.alertEmail = alertEmail;
  await user.save();
  return toAccount(user);
}
