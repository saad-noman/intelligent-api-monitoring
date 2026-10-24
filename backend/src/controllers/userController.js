// Thin HTTP handlers for account settings. Preference storage belongs in services/userService.js.
import * as userService from '../services/userService.js';
import { isEmailConfigured } from '../modules/email-notifications/index.js';
import { parseBoolean, parseEmail } from '../utils/validation.js';

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
