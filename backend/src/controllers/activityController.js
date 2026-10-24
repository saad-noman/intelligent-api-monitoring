// Thin HTTP handlers for the alert activity history. Storage belongs in
// services/alertActivityService.js.
import {
  listActivities,
  deleteActivity as removeActivity,
  clearActivities,
  isValidActivityId,
} from '../services/alertActivityService.js';
import { AppError } from '../utils/errors.js';

// GET /activity (requireAuth)
export async function listActivity(req, res) {
  const activities = await listActivities(req.user.id);
  res.json({ activities, count: activities.length });
}

// DELETE /activity/:activityId (requireAuth): deletes one history entry.
export async function deleteActivity(req, res) {
  const { activityId } = req.params;
  if (!isValidActivityId(activityId)) throw new AppError(400, 'VALIDATION_ERROR', 'The history entry ID is invalid.');

  const deleted = await removeActivity(req.user.id, activityId);
  if (!deleted) throw new AppError(404, 'ACTIVITY_NOT_FOUND', 'This history entry was not found.');
  res.status(204).end();
}

// DELETE /activity (requireAuth): deletes the user's whole history.
export async function clearActivity(req, res) {
  const deletedCount = await clearActivities(req.user.id);
  res.json({ deletedCount });
}
