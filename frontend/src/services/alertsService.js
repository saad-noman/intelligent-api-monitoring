import { apiRequest } from './apiClient.js';
import { PAYLOAD_KEYS, readList, toMonitoringItem } from '../utils/monitoringData.js';

function alertPath(alertId) {
  return `/alerts/${encodeURIComponent(alertId)}`;
}

export async function getActiveAlerts() {
  const data = await apiRequest('/alerts');
  return readList(data, PAYLOAD_KEYS.alerts).map(toMonitoringItem);
}

// One saved alert (active or not) by its unique alert ID.
export async function getAlertById(alertId) {
  const data = await apiRequest(alertPath(alertId));
  return toMonitoringItem(data?.alert);
}

// Resolves (active = false) or reopens (active = true) an alert. Returns the updated alert.
export async function updateAlertStatus(alertId, active) {
  const data = await apiRequest(`${alertPath(alertId)}/status`, { method: 'PATCH', body: { active } });
  return toMonitoringItem(data?.alert);
}

// Permanently deletes one alert.
export async function deleteAlert(alertId) {
  await apiRequest(alertPath(alertId), { method: 'DELETE' });
}

// Emails the active alerts to the saved report email. Returns { status, message }.
export async function emailAlertReport() {
  const data = await apiRequest('/alerts/report', { method: 'POST' });
  return data?.email ?? null;
}

// Emails one alert to the saved report email. Returns { status, message }.
export async function emailSingleAlert(alertId) {
  const data = await apiRequest(`${alertPath(alertId)}/report`, { method: 'POST' });
  return data?.email ?? null;
}
