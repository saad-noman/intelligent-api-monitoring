import { apiRequest } from './apiClient.js';

const ALERT_EMAIL_PATH = '/users/me/alert-email';

// Report settings plus whether the server can send email:
// { alertEmail, emailReportsEnabled, deliveryConfigured }.
export async function getEmailSettings() {
  return apiRequest('/users/me/email-settings');
}

// The alert-recipient email is separate from the account's login email.
export async function updateAlertEmail(alertEmail) {
  return apiRequest(ALERT_EMAIL_PATH, { method: 'PATCH', body: { alertEmail } });
}

export async function removeAlertEmail() {
  return apiRequest(ALERT_EMAIL_PATH, { method: 'DELETE' });
}

export async function updateName(firstName, lastName) {
  return apiRequest('/users/me/name', { method: 'PATCH', body: { firstName, lastName } });
}

// Changes the login email; the current password is required.
export async function updateAccountEmail(email, currentPassword) {
  return apiRequest('/users/me/email', { method: 'PATCH', body: { email, currentPassword } });
}

export async function changePassword(currentPassword, newPassword) {
  return apiRequest('/users/me/password', { method: 'PATCH', body: { currentPassword, newPassword } });
}

// Permanently deletes the account and all of its data; the password is required.
export async function deleteAccount(password) {
  return apiRequest('/users/me', { method: 'DELETE', body: { password } });
}

// Turns anomaly report emails on (true) or off (false).
export async function setEmailReportsEnabled(enabled) {
  return apiRequest('/users/me/email-reports', { method: 'PATCH', body: { enabled } });
}
