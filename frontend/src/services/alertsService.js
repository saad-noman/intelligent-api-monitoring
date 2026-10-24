import { apiRequest } from './apiClient.js';
import { PAYLOAD_KEYS, readList, toMonitoringItem } from '../utils/monitoringData.js';

export async function getActiveAlerts() {
  const data = await apiRequest('/alerts');
  return readList(data, PAYLOAD_KEYS.alerts).map(toMonitoringItem);
}
