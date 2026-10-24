import { apiRequest } from './apiClient.js';
import { PAYLOAD_KEYS, readList, toMonitoringItem } from '../utils/monitoringData.js';

// Works for guests and authenticated users; the backend decides whether to persist.
// The input is sent as supplied (a single observation object or a batch array).
// Returns { items, errors, summary, persistence, email } from the backend response.
export async function submitMonitoring(apiResponses) {
  const data = await apiRequest('/monitor', { method: 'POST', body: apiResponses });
  return {
    items: readList(data, PAYLOAD_KEYS.monitorResults).map(toMonitoringItem),
    errors: readList(data, PAYLOAD_KEYS.monitorErrors),
    summary: data?.summary ?? null,
    persistence: data?.persistence ?? null,
    email: data?.email ?? null,
  };
}

// The backend's static sample batch file.
export async function getSampleBatch() {
  return apiRequest('/monitor/sample');
}

export async function getMonitoringRecords() {
  const data = await apiRequest('/monitor/records');
  return readList(data, PAYLOAD_KEYS.monitorRecords).map(toMonitoringItem);
}
