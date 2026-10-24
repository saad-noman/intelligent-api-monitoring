export const NOT_AVAILABLE = 'Not available';

export function formatValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return NOT_AVAILABLE;
  return `${value}${suffix}`;
}

export function formatMs(value) {
  return formatValue(value, ' ms');
}
