import { apiRequest } from './apiClient.js';
import { PAYLOAD_KEYS, readList, toMonitoringItem } from '../utils/monitoringData.js';

// Works for guests and authenticated users; the backend decides whether to persist.
// The input is sent as supplied (a single response object or a batch array).
export async function submitMonitoring(apiResponses) {
  const data = await apiRequest('/monitor', { method: 'POST', body: apiResponses });
  return readList(data, PAYLOAD_KEYS.monitorResults).map(toMonitoringItem);
}

export async function getMonitoringRecords() {
  const data = await apiRequest('/monitor/records');
  return readList(data, PAYLOAD_KEYS.monitorRecords).map(toMonitoringItem);
}
