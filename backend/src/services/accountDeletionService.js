// Permanently deletes an account and everything stored for it. Each step reuses the
// owning module's own delete function, so every query stays scoped to the owner.
import { deleteAllAlerts } from './alertStorageService.js';
import { clearActivities } from './alertActivityService.js';
import { deleteAllRecords } from './monitoringRecordService.js';
import { endAllSessions } from './authService.js';
import { deleteUser } from './userService.js';

export async function deleteAccountAndData(userId) {
  await deleteAllAlerts(userId);
  await clearActivities(userId);
  await deleteAllRecords(userId);
  // The user and their sessions go last, so a failure above can be retried while still logged in.
  await deleteUser(userId);
  await endAllSessions(userId);
}
