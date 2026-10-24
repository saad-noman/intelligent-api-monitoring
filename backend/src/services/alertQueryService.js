// Read-only retrieval of the owning user's anomalies.
import { Anomaly } from '../models/Anomaly.js';

const ALERTS_LIMIT = 200;

// Client-facing alert shape, shared by GET /alerts, GET /alerts/:alertId and the email report.
export function toAlertView(anomaly) {
  return {
    id: anomaly._id.toString(),
    alert_id: anomaly.alert_id,
    api_name: anomaly.api_name,
    response_time_ms: anomaly.response_time_ms,
    status_code: anomaly.status_code,
    records_returned: anomaly.records_returned,
    anomalies: anomaly.findings,
    explanation: anomaly.alert_message ?? null,
    analysis_status: anomaly.analysis_status,
    analysis_error: anomaly.analysis_error ?? null,
    analysis: anomaly.analysis ?? null,
    ai_model: anomaly.ai_model ?? null,
    active: anomaly.active,
    detected_at: anomaly.detected_at,
  };
}

export async function listActiveAlerts(ownerId) {
  const anomalies = await Anomaly.find({ owner: ownerId, active: true })
    .sort({ detected_at: -1 })
    .limit(ALERTS_LIMIT)
    .lean();
  return anomalies.map(toAlertView);
}

// Finds one of the owner's alerts by its issue ID (active or not). Returns null if none.
export async function findAlertById(ownerId, alertId) {
  const anomaly = await Anomaly.findOne({ owner: ownerId, alert_id: alertId }).lean();
  return anomaly ? toAlertView(anomaly) : null;
}
