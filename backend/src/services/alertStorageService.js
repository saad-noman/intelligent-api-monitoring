// Persists detected anomalies, with their alert text, for the owning user, and applies
// owner-scoped changes to them (status update, deletion).
import { Anomaly } from '../models/Anomaly.js';
import { toAlertView } from './alertQueryService.js';
import { createAlertId } from '../utils/alertId.js';

// `entries`: [{ recordId, result }] where `result` is an anomalous monitorService result.
export async function saveAnomalies(ownerId, entries) {
  const documents = entries.map(({ recordId, result }) => ({
    alert_id: result.alert_id,
    owner: ownerId,
    monitoring_record: recordId,
    api_name: result.api_name,
    response_time_ms: result.response_time_ms,
    status_code: result.status_code,
    records_returned: result.records_returned,
    anomaly_types: result.anomalies.map((finding) => finding.type),
    findings: result.anomalies,
    alert_message: result.explanation,
    alert_source: result.alert_source,
    analysis: result.analysis,
    ai_model: result.ai_model,
    detected_at: result.detected_at,
  }));
  return Anomaly.insertMany(documents);
}

// Gives a unique alert ID to the owner's alerts saved before IDs existed, so they can be
// viewed, searched, and acted on like newer alerts. Returns how many were updated.
export async function assignMissingAlertIds(ownerId) {
  // `alert_id: null` matches documents where the field is missing or null.
  const legacyAlerts = await Anomaly.find({ owner: ownerId, alert_id: null }).select('_id detected_at').lean();
  for (const anomaly of legacyAlerts) {
    await Anomaly.updateOne({ _id: anomaly._id }, { alert_id: createAlertId(anomaly.detected_at) });
  }
  return legacyAlerts.length;
}

// Marks an alert active (open) or inactive (resolved). Returns the updated view, or null if not found.
export async function updateAlertStatus(ownerId, alertId, active) {
  const anomaly = await Anomaly.findOneAndUpdate(
    { owner: ownerId, alert_id: alertId },
    { active },
    { returnDocument: 'after' },
  ).lean();
  return anomaly ? toAlertView(anomaly) : null;
}

// Permanently deletes one alert. Returns true when a document was deleted.
// The originating monitoring record is kept as history.
export async function deleteAlert(ownerId, alertId) {
  const { deletedCount } = await Anomaly.deleteOne({ owner: ownerId, alert_id: alertId });
  return deletedCount > 0;
}
