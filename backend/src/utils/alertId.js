// Human-readable unique IDs for detected API issues, e.g. "ALR-20261024-9F2C41AB".
// The date part shows when the issue was detected; the random part makes it unique.
// Uniqueness is also enforced by a unique index on Anomaly.alert_id.
import { randomBytes } from 'node:crypto';

const PREFIX = 'ALR';
const RANDOM_BYTES = 4; // 8 hex characters

export const ALERT_ID_PATTERN = /^ALR-\d{8}-[0-9A-F]{8}$/;

// "2026-10-24T11:14:43.772Z" -> "20261024" (UTC)
function formatDatePart(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

export function createAlertId(date = new Date()) {
  const randomPart = randomBytes(RANDOM_BYTES).toString('hex').toUpperCase();
  return `${PREFIX}-${formatDatePart(date)}-${randomPart}`;
}

// Accepts surrounding spaces and lower case; returns the normalized ID or null.
export function normalizeAlertId(value) {
  if (typeof value !== 'string') return null;
  const alertId = value.trim().toUpperCase();
  return ALERT_ID_PATTERN.test(alertId) ? alertId : null;
}
