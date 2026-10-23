import { notImplemented } from './apiClient.js';

// Works for guests and authenticated users; the backend decides whether to persist.
export async function submitMonitoring(apiResponses) {
  throw notImplemented('POST /monitor');
}

export async function getMonitoringRecords() {
  throw notImplemented('GET /monitor/records');
}
