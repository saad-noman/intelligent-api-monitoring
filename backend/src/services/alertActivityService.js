// Records and manages the history of actions performed on alerts. Every operation is
// scoped to the owning user.
import mongoose from 'mongoose';
import { AlertActivity } from '../models/AlertActivity.js';
import { Anomaly } from '../models/Anomaly.js';
import { logger } from '../utils/logger.js';

const HISTORY_LIMIT = 300;

// `alert` is an alert view (see alertQueryService.toAlertView).
function toActivityDocument(ownerId, alert, action, details) {
  return {
    owner: ownerId,
    action,
    alert_id: alert.alert_id,
    api_name: alert.api_name,
    alert_message: alert.explanation ?? null,
    anomaly_types: (alert.anomalies ?? []).map((finding) => finding.type),
    severity: alert.analysis?.severity ?? null,
    details: details ?? null,
  };
}

function toActivityView(activity) {
  return {
    id: activity._id.toString(),
    action: activity.action,
    alert_id: activity.alert_id,
    api_name: activity.api_name,
    alert_message: activity.alert_message,
    anomaly_types: activity.anomaly_types,
    severity: activity.severity,
    details: activity.details,
    created_at: activity.createdAt,
  };
}

// Saves one history entry. A failure is logged and never breaks the action itself.
export async function recordActivity(ownerId, alert, action, details) {
  try {
    await AlertActivity.create(toActivityDocument(ownerId, alert, action, details));
  } catch (error) {
    logger.error(`Recording alert activity failed: ${error.name}: ${error.message}`);
  }
}

async function findAvailableAlertIds(ownerId, alertIds) {
  const existing = await Anomaly.find({ owner: ownerId, alert_id: { $in: alertIds } }).distinct('alert_id');
  return new Set(existing);
}

// Only entries whose alert still exists are returned (older entries of deleted alerts are skipped).
export async function listActivities(ownerId) {
  const activities = await AlertActivity.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(HISTORY_LIMIT).lean();
  const availableAlertIds = await findAvailableAlertIds(ownerId, activities.map((activity) => activity.alert_id));
  return activities
    .filter((activity) => availableAlertIds.has(activity.alert_id))
    .map(toActivityView);
}

// Removes the history of one alert; called when the alert itself is deleted.
// A failure is logged and never breaks the deletion.
export async function deleteActivitiesForAlert(ownerId, alertId) {
  try {
    await AlertActivity.deleteMany({ owner: ownerId, alert_id: alertId });
  } catch (error) {
    logger.error(`Deleting alert history failed: ${error.name}: ${error.message}`);
  }
}

export function isValidActivityId(activityId) {
  return mongoose.isValidObjectId(activityId);
}

// Returns true when an entry was deleted.
export async function deleteActivity(ownerId, activityId) {
  const { deletedCount } = await AlertActivity.deleteOne({ owner: ownerId, _id: activityId });
  return deletedCount > 0;
}

// Returns how many entries were deleted.
export async function clearActivities(ownerId) {
  const { deletedCount } = await AlertActivity.deleteMany({ owner: ownerId });
  return deletedCount;
}
