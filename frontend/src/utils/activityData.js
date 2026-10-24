// Maps GET /activity entries to the shape the History page renders.

export const ACTIVITY_PAYLOAD_KEY = 'activities';

// Display label per backend action.
export const ACTIVITY_LABELS = {
  resolved: 'Resolved',
  reopened: 'Reopened',
  emailed: 'Emailed',
};

export function toActivityItem(raw = {}) {
  return {
    id: raw.id ?? null,
    action: raw.action ?? null,
    alertId: raw.alert_id ?? null,
    apiName: raw.api_name ?? null,
    alertMessage: raw.alert_message ?? null,
    anomalyTypes: Array.isArray(raw.anomaly_types) ? raw.anomaly_types : [],
    severity: raw.severity ?? null,
    details: raw.details ?? null,
    createdAt: raw.created_at ?? null,
  };
}
