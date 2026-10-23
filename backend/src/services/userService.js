// Account settings. Owns the alert-recipient email preference, which is separate from
// the account's registration/login email.
import { NotImplementedError } from '../utils/errors.js';

export async function getAlertEmail(userId) {
  throw new NotImplementedError('userService.getAlertEmail');
}

export async function updateAlertEmail(userId, alertEmail) {
  throw new NotImplementedError('userService.updateAlertEmail');
}
