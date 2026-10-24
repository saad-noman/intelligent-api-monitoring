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

// Turns anomaly report emails on (true) or off (false).
export async function setEmailReportsEnabled(enabled) {
  return apiRequest('/users/me/email-reports', { method: 'PATCH', body: { enabled } });
}
