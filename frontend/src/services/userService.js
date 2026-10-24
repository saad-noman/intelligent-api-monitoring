import { apiRequest } from './apiClient.js';

// The alert-recipient email is separate from the account's login email.
export async function updateAlertEmail(alertEmail) {
  return apiRequest('/users/me/alert-email', { method: 'PATCH', body: { alertEmail } });
}
