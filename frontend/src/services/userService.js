import { notImplemented } from './apiClient.js';

// The alert-recipient email is separate from the account's login email.
export async function updateAlertEmail(alertEmail) {
  throw notImplemented('PATCH /users/me/alert-email');
}
