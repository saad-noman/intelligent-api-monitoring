// Persists detected anomalies, with their AI analysis, for the owning user, and applies
// owner-scoped changes to them (analysis update, status update, deletion).
import mongoose from 'mongoose';
import { Anomaly } from '../models/Anomaly.js';
import { ANALYSIS_STATUS } from '../modules/ai-alert-generator/index.js';
import { toAlertView } from './alertQueryService.js';
import { createAlertId } from '../utils/alertId.js';

// Analysis fields (see alertAnalysisService) -> stored document fields.
function toStoredAnalysis(fields) {
  return {
    alert_message: fields.explanation,
    analysis_status: fields.analysis_status,
    analysis_error: fields.analysis_error,
    analysis: fields.analysis,
    ai_model: fields.ai_model,
  };
}

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
    ...toStoredAnalysis(result),
    detected_at: result.detected_at,
  }));
  return Anomaly.insertMany(documents);
}

// The stored anomaly document of one of the owner's alerts, or null.
export async function findOwnedAnomaly(ownerId, alertId) {
  return Anomaly.findOne({ owner: ownerId, alert_id: alertId }).lean();
}

// Replaces the AI analysis of one alert. Returns the updated view, or null if not found.
export async function saveAlertAnalysis(ownerId, alertId, fields) {
  const anomaly = await Anomaly.findOneAndUpdate(
    { owner: ownerId, alert_id: alertId },
    toStoredAnalysis(fields),
    { returnDocument: 'after' },
  ).lean();
  return anomaly ? toAlertView(anomaly) : null;
}

// Alerts saved before `analysis_status` existed used `alert_source`: "llm" alerts become
// "completed"; "fallback" alerts lose their template text and become "failed", so the
// user can run the AI analysis for them. The raw collection is used because
// `alert_source` is no longer in the schema (Mongoose would drop it from the update).
export async function upgradeLegacyAlerts(ownerId) {
  const owner = new mongoose.Types.ObjectId(String(ownerId));
  await Anomaly.collection.updateMany(
    { owner, alert_source: 'llm' },
    { $set: { analysis_status: ANALYSIS_STATUS.completed, analysis_error: null }, $unset: { alert_source: '' } },
  );
  await Anomaly.collection.updateMany(
    { owner, alert_source: 'fallback' },
    {
      $set: {
        analysis_status: ANALYSIS_STATUS.failed,
        analysis_error: 'saved_without_ai_analysis',
        alert_message: null,
        analysis: null,
      },
      $unset: { alert_source: '' },
    },
  );
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

// Permanently deletes all of the owner's alerts (active and resolved). Returns how many
// were deleted. Monitoring records are kept as history, as with a single deletion.
export async function deleteAllAlerts(ownerId) {
  const { deletedCount } = await Anomaly.deleteMany({ owner: ownerId });
  return deletedCount;
}
