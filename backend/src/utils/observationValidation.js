// Validation of monitoring observations submitted to POST /monitor.
// The payload may be one observation object or a batch array. Each item is validated
// on its own so one bad item never discards the valid items in the same batch.
// Messages name the field but never echo the submitted value.
import { AppError } from './errors.js';

const API_NAME_MAX_LENGTH = 100;
const STATUS_CODE_MIN = 100;
const STATUS_CODE_MAX = 599;

// Metric fields that may be missing. A missing metric is not a validation error: the
// detection rules flag it as an anomaly (MISSING_RECORDS / INCOMPLETE_DATA) instead.
export const METRIC_FIELDS = ['response_time_ms', 'status_code', 'records_returned'];

function isMissing(value) {
  return value === undefined || value === null;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkApiName(value) {
  if (typeof value !== 'string' || value.trim() === '') return 'api_name is required and must be a non-empty string.';
  if (value.trim().length > API_NAME_MAX_LENGTH) return `api_name must be at most ${API_NAME_MAX_LENGTH} characters.`;
  return null;
}

function checkResponseTime(value) {
  if (isMissing(value)) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 'response_time_ms must be a non-negative number.';
  }
  return null;
}

function checkStatusCode(value) {
  if (isMissing(value)) return null;
  if (!Number.isInteger(value) || value < STATUS_CODE_MIN || value > STATUS_CODE_MAX) {
    return `status_code must be an integer between ${STATUS_CODE_MIN} and ${STATUS_CODE_MAX}.`;
  }
  return null;
}

function checkRecordsReturned(value) {
  if (isMissing(value)) return null;
  if (!Number.isInteger(value) || value < 0) return 'records_returned must be a non-negative integer.';
  return null;
}

const FIELD_CHECKS = {
  api_name: checkApiName,
  response_time_ms: checkResponseTime,
  status_code: checkStatusCode,
  records_returned: checkRecordsReturned,
};

// Returns the list of { field, message } problems for one item (empty when valid).
function collectFieldErrors(item) {
  const errors = [];
  for (const [field, check] of Object.entries(FIELD_CHECKS)) {
    const message = check(item[field]);
    if (message) errors.push({ field, message });
  }
  return errors;
}

// Normalized observation: missing metrics become null so rules can detect them.
function toObservation(item, index) {
  const observation = {
    index,
    api_name: item.api_name.trim(),
    response_time_ms: item.response_time_ms ?? null,
    status_code: item.status_code ?? null,
    records_returned: item.records_returned ?? null,
  };
  // Kept in memory only for optional schema checks; never stored or sent to the LLM.
  if (item.response_body !== undefined) observation.response_body = item.response_body;
  return observation;
}

function validateItem(item, index) {
  if (!isPlainObject(item)) {
    return { error: { index, api_name: null, errors: [{ field: null, message: 'Each observation must be a JSON object.' }] } };
  }
  const errors = collectFieldErrors(item);
  if (errors.length > 0) {
    const apiName = typeof item.api_name === 'string' && item.api_name.trim() ? item.api_name.trim() : null;
    return { error: { index, api_name: apiName, errors } };
  }
  return { observation: toObservation(item, index) };
}

function toItemList(payload, maxBatchSize) {
  const items = Array.isArray(payload) ? payload : [payload];
  if (!Array.isArray(payload) && !isPlainObject(payload)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'The request body must be an observation object or an array of observations.');
  }
  if (items.length === 0) throw new AppError(400, 'VALIDATION_ERROR', 'The batch must contain at least one observation.');
  if (items.length > maxBatchSize) {
    throw new AppError(400, 'VALIDATION_ERROR', `The batch must contain at most ${maxBatchSize} observations.`);
  }
  return items;
}

// Splits a payload into valid observations and item-level errors.
// Throws 400 when the payload shape is wrong or no item is valid.
export function validateObservations(payload, { maxBatchSize }) {
  const observations = [];
  const errors = [];
  toItemList(payload, maxBatchSize).forEach((item, index) => {
    const result = validateItem(item, index);
    if (result.observation) observations.push(result.observation);
    else errors.push(result.error);
  });

  if (observations.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No valid observations were submitted.', errors);
  }
  return { observations, errors };
}
