export const NOT_AVAILABLE = 'Not available';

export function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return NOT_AVAILABLE;
  return `${value}${suffix}`;
}

export function formatMs(value) {
  return formatValue(value, ' ms');
}

export function formatDateTime(value) {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? NOT_AVAILABLE : date.toLocaleString();
}

// Backend `active` flag -> "Active" / "Resolved".
export function formatAlertStatus(active) {
  if (active === null || active === undefined) return NOT_AVAILABLE;
  return active ? 'Active' : 'Resolved';
}

// Rule evidence such as { status_code: 500 } or { missing_fields: ['x'] } -> "status_code: 500".
export function formatObserved(observed) {
  return Object.entries(observed ?? {})
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : formatValue(value)}`)
    .join('; ');
}
