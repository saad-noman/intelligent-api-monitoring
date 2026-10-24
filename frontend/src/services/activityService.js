import { apiRequest } from './apiClient.js';
import { readList } from '../utils/monitoringData.js';
import { ACTIVITY_PAYLOAD_KEY, toActivityItem } from '../utils/activityData.js';

// The user's alert history (resolved, reopened, emailed, deleted), newest first.
export async function getActivities() {
  const data = await apiRequest('/activity');
  return readList(data, ACTIVITY_PAYLOAD_KEY).map(toActivityItem);
}

export async function deleteActivity(activityId) {
  await apiRequest(`/activity/${encodeURIComponent(activityId)}`, { method: 'DELETE' });
}

// Deletes the whole history. Returns how many entries were deleted.
export async function clearActivities() {
  const data = await apiRequest('/activity', { method: 'DELETE' });
  return data?.deletedCount ?? 0;
}
