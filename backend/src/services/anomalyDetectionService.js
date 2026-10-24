// Identifies anomalies in validated observations using deterministic, explainable rules.
// Pure logic: no database access, no HTTP concerns, no AI calls. The LLM only describes
// the findings returned here; it never adds or removes them.
//
// Each finding: { type, rule, observed, threshold?, ... }
//   type      - one of ANOMALY_TYPES
//   rule      - the human-readable condition that triggered it
//   observed  - the exact observed values the rule looked at
// High latency also records threshold_source, baseline, and user_impact; failed requests
// record status_class (RFC 9110: 4xx client error, 5xx server error).
import { METRIC_FIELDS } from '../utils/observationValidation.js';
import { resolveLatencyThreshold, classifyUserImpact, describeLatencyRule } from '../utils/latencyThreshold.js';

// RFC 9110 status code classes, keyed by the first digit of the status code.
const STATUS_CLASSES = {
  4: 'client_error',
  5: 'server_error',
};

export const ANOMALY_TYPES = {
  highResponseTime: 'HIGH_RESPONSE_TIME',
  failedRequest: 'FAILED_REQUEST',
  zeroRecords: 'ZERO_RECORDS',
  missingRecords: 'MISSING_RECORDS',
  incompleteData: 'INCOMPLETE_DATA',
  schemaMismatch: 'SCHEMA_MISMATCH',
};

// The threshold comes from AI research of published guidance when available, else from
// this API's learned history, else the configured SLO (see utils/latencyThreshold.js).
// The comparison with the observed response time is always made here, in code.
function highResponseTimeRule(observation, policy, context) {
  const value = observation.response_time_ms;
  if (value === null) return null;

  const threshold = resolveLatencyThreshold(context.latencyBaseline, policy, context.latencyResearch);
  if (value <= threshold.value) return null;
  return {
    type: ANOMALY_TYPES.highResponseTime,
    rule: describeLatencyRule(threshold, policy.latency),
    observed: { response_time_ms: value },
    threshold: threshold.value,
    threshold_source: threshold.source,
    baseline: threshold.baseline,
    research: threshold.research,
    user_impact: classifyUserImpact(value, policy.latency),
  };
}

function statusClassOf(statusCode) {
  return STATUS_CLASSES[Math.floor(statusCode / 100)] ?? 'other';
}

function failedRequestRule(observation, policy) {
  const value = observation.status_code;
  if (value === null || value < policy.failedStatusMin) return null;
  return {
    type: ANOMALY_TYPES.failedRequest,
    rule: `status_code >= ${policy.failedStatusMin}`,
    observed: { status_code: value },
    threshold: policy.failedStatusMin,
    status_class: statusClassOf(value),
  };
}

function zeroRecordsRule(observation) {
  if (observation.records_returned !== 0) return null;
  return { type: ANOMALY_TYPES.zeroRecords, rule: 'records_returned = 0', observed: { records_returned: 0 } };
}

function missingRecordsRule(observation) {
  if (observation.records_returned !== null) return null;
  return {
    type: ANOMALY_TYPES.missingRecords,
    rule: 'records_returned is missing',
    observed: { records_returned: null },
  };
}

// Missing latency or status prevents the corresponding checks, so it is reported rather
// than silently treated as normal. (records_returned has its own rule above.)
function incompleteDataRule(observation) {
  const missingFields = METRIC_FIELDS.filter(
    (field) => field !== 'records_returned' && observation[field] === null,
  );
  if (missingFields.length === 0) return null;
  return {
    type: ANOMALY_TYPES.incompleteData,
    rule: 'required metric is missing',
    observed: { missing_fields: missingFields },
  };
}

function findMissingFields(body, requiredFields) {
  const items = Array.isArray(body) ? body : [body];
  const missing = new Set();
  for (const item of items) {
    const isObject = typeof item === 'object' && item !== null && !Array.isArray(item);
    for (const field of requiredFields) {
      if (!isObject || !(field in item)) missing.add(field);
    }
  }
  return [...missing];
}

// Runs only when a response_body AND a configured schema for this API both exist.
function schemaRule(observation, policy) {
  const schema = policy.responseSchemas?.[observation.api_name];
  if (observation.response_body === undefined || !Array.isArray(schema?.requiredFields)) return null;

  const missingFields = findMissingFields(observation.response_body, schema.requiredFields);
  if (missingFields.length === 0) return null;
  return {
    type: ANOMALY_TYPES.schemaMismatch,
    rule: 'response_body is missing fields required by the configured schema',
    observed: { missing_fields: missingFields },
  };
}

const RULES = [
  failedRequestRule,
  highResponseTimeRule,
  zeroRecordsRule,
  missingRecordsRule,
  incompleteDataRule,
  schemaRule,
];

// Returns the findings for one observation (empty when nothing is anomalous).
// `context.latencyBaseline`: this API's learned baseline, or undefined/null when none.
// `context.latencyResearch`: this API's AI-researched threshold, or undefined/null when none.
export function detectAnomalies(observation, policy, context = {}) {
  return RULES.map((rule) => rule(observation, policy, context)).filter(Boolean);
}
