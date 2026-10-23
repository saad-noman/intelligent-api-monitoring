// Thin HTTP handlers for account settings. Preference storage belongs in services/userService.js.
import { NotImplementedError } from '../utils/errors.js';

// PATCH /users/me/alert-email (requireAuth)
export function updateAlertEmail(req, res) {
  // TODO: Validate the alert-recipient email and delegate to userService.updateAlertEmail(req.user.id, ...).
  // This address is independent of the account's registration/login email.
  throw new NotImplementedError('PATCH /users/me/alert-email');
}
