// Thin HTTP handlers for account settings. Preference storage belongs in services/userService.js.
import * as userService from '../services/userService.js';
import * as authService from '../services/authService.js';
import { deleteAccountAndData } from '../services/accountDeletionService.js';
import { isEmailConfigured } from '../modules/email-notifications/index.js';
import { parseBoolean, parseEmail, parseName, parsePassword, parseNewPassword } from '../utils/validation.js';

// PATCH /users/me/name (requireAuth): body { firstName, lastName }.
export async function updateName(req, res) {
  const account = await userService.updateName(req.user.id, {
    firstName: parseName(req.body?.firstName, 'First name'),
    lastName: parseName(req.body?.lastName, 'Last name'),
  });
  res.json({ account });
}

// PATCH /users/me/email (requireAuth): body { email, currentPassword } changes the login email.
export async function updateAccountEmail(req, res) {
  const account = await authService.changeEmail(req.user.id, {
    email: parseEmail(req.body?.email),
    currentPassword: parsePassword(req.body?.currentPassword, 'Current password'),
  });
  res.json({ account });
}

// PATCH /users/me/password (requireAuth): body { currentPassword, newPassword }.
export async function updatePassword(req, res) {
  await authService.changePassword(req.user.id, {
    currentPassword: parsePassword(req.body?.currentPassword, 'Current password'),
    newPassword: parseNewPassword(req.body?.newPassword, 'New password'),
  });
  res.status(204).end();
}

// DELETE /users/me (requireAuth): body { password } permanently deletes the account and its data.
export async function deleteAccount(req, res) {
  await authService.confirmPassword(req.user.id, parsePassword(req.body?.password));
  await deleteAccountAndData(req.user.id);
  res.status(204).end();
}

// GET /users/me/email-settings (requireAuth)
// The user's report settings plus whether the server can deliver email at all.
export async function getEmailSettings(req, res) {
  const { alertEmail, enabled } = await userService.getEmailReportSettings(req.user.id);
  res.json({ alertEmail, emailReportsEnabled: enabled, deliveryConfigured: isEmailConfigured() });
}

// PATCH /users/me/alert-email (requireAuth)
// This address is independent of the account's registration/login email.
export async function updateAlertEmail(req, res) {
  const alertEmail = parseEmail(req.body?.alertEmail, 'Alert email');
  const account = await userService.updateAlertEmail(req.user.id, alertEmail);
  res.json({ account });
}

// DELETE /users/me/alert-email (requireAuth)
export async function removeAlertEmail(req, res) {
  const account = await userService.removeAlertEmail(req.user.id);
  res.json({ account });
}

// PATCH /users/me/email-reports (requireAuth): body { enabled: boolean } turns reports on or off.
export async function updateEmailReports(req, res) {
  const enabled = parseBoolean(req.body?.enabled, 'enabled');
  const account = await userService.updateEmailReportsEnabled(req.user.id, enabled);
  res.json({ account });
}
