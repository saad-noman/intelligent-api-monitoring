// Thin HTTP handlers for account settings. Preference storage belongs in services/userService.js.
import * as userService from '../services/userService.js';
import { parseEmail } from '../utils/validation.js';

// PATCH /users/me/alert-email (requireAuth)
// This address is independent of the account's registration/login email.
export async function updateAlertEmail(req, res) {
  const alertEmail = parseEmail(req.body?.alertEmail, 'Alert email');
  const account = await userService.updateAlertEmail(req.user.id, alertEmail);
  res.json({ account });
}
