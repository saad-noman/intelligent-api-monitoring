// Single place that maps backend payloads to the shape the UI renders.
// The backend response schemas are not finalized; only the four response fields below
// come from the specification. The PAYLOAD_KEYS are assumptions to confirm with the
// backend and change here only.
import { formatMs, formatValue } from './format.js';

export const PAYLOAD_KEYS = {
  monitorResults: 'results',
  monitorRecords: 'records',
  alerts: 'alerts',
  anomalies: 'anomalies',
  anomalyType: 'type',
  explanation: 'explanation',
};

// API response fields from the specification. Every table, card, and input hint reads
// from this list, so a field is added or renamed in one place.
export const RESPONSE_FIELDS = [
  { key: 'apiName', source: 'api_name', label: 'API name', type: 'string', format: formatValue },
  { key: 'responseTimeMs', source: 'response_time_ms', label: 'Response time', type: 'number', format: formatMs },
  { key: 'statusCode', source: 'status_code', label: 'HTTP status', type: 'number', format: formatValue },
  { key: 'recordsReturned', source: 'records_returned', label: 'Records returned', type: 'number', format: formatValue },
];

// Fields shown as supporting facts next to an API name.
export const METRIC_FIELDS = RESPONSE_FIELDS.filter((field) => field.key !== 'apiName');

// Accepts either a bare array or an object wrapping the list under `key`.
export function readList(payload, key) {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload?.[key]) ? payload[key] : [];
}

// Missing fields stay null so the UI can show "Not available" instead of a made-up value.
export function toMonitoringItem(raw = {}) {
  const item = Object.fromEntries(RESPONSE_FIELDS.map(({ key, source }) => [key, raw[source] ?? null]));
  const anomalies = Array.isArray(raw[PAYLOAD_KEYS.anomalies]) ? raw[PAYLOAD_KEYS.anomalies] : [];
  return {
    ...item,
    // Anomaly labels are whatever the backend detected; the frontend never derives them.
    anomalies: anomalies
      .map((anomaly) => (typeof anomaly === 'string' ? anomaly : anomaly?.[PAYLOAD_KEYS.anomalyType]))
      .filter(Boolean),
    explanation: raw[PAYLOAD_KEYS.explanation] ?? null,
  };
}

export function isAnomalous(item) {
  return item.anomalies.length > 0;
}

// Input hint built from the field list, e.g. [{ "api_name": "string", ... }].
export function inputTemplate() {
  const example = Object.fromEntries(RESPONSE_FIELDS.map(({ source, type }) => [source, type]));
  return JSON.stringify([example], null, 2);
}
