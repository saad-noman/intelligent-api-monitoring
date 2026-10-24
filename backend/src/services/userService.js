// Account settings. Owns the alert-recipient email preference, which is separate from
// the account's registration/login email.
import { User } from '../models/User.js';
import { AppError } from '../utils/errors.js';

// The account fields that are safe to send to the client.
export function toAccount(user) {
  return {
    id: user._id.toString(),
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email,
    alertEmail: user.alertEmail ?? null,
    emailReportsEnabled: user.emailReportsEnabled !== false,
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

// The recipient and on/off switch used before sending an anomaly report.
export async function getEmailReportSettings(userId) {
  const user = await findUserOrThrow(userId);
  return { alertEmail: user.alertEmail ?? null, enabled: user.emailReportsEnabled !== false };
}

// Saves one or more account settings fields and returns the updated account.
async function updateUserFields(userId, fields) {
  const user = await findUserOrThrow(userId);
  Object.assign(user, fields);
  await user.save();
  return toAccount(user);
}

// Deletes only the user document; see accountDeletionService for the full cleanup.
export async function deleteUser(userId) {
  await User.deleteOne({ _id: userId });
}

export async function updateName(userId, { firstName, lastName }) {
  return updateUserFields(userId, { firstName, lastName });
}

export async function updateAlertEmail(userId, alertEmail) {
  return updateUserFields(userId, { alertEmail });
}

export async function removeAlertEmail(userId) {
  return updateUserFields(userId, { alertEmail: null });
}

export async function updateEmailReportsEnabled(userId, enabled) {
  return updateUserFields(userId, { emailReportsEnabled: enabled });
}
