// Input and output checks around the LLM call. An answer that fails a check is
// discarded and the agent asks the next model, so an ungrounded answer never reaches the user.
import { ANOMALY_TYPES } from '../../../services/anomalyDetectionService.js';

const KNOWN_TYPES = Object.values(ANOMALY_TYPES);
const NUMBER_PATTERN = /\d+(?:\.\d+)?/g;
// Phrases that assert a cause as fact instead of hedging it.
const UNHEDGED_CAUSE_PATTERN = /\b(caused by|due to|because of|the root cause|the cause is)\b/i;

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

export const ANALYSIS_LIMITS = {
  maxAlertLength: 400,
  maxSentenceLength: 250,
  maxItemLength: 200,
  maxListItems: 3,
};

export class GuardrailError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'GuardrailError';
    this.reason = reason;
  }
}

export function validateInput(context) {
  if (typeof context.api_name !== 'string' || context.api_name === '') throw new GuardrailError('missing_api_name');
  if (context.anomalies.length === 0) throw new GuardrailError('no_anomalies');
  if (!context.anomalies.every((anomaly) => KNOWN_TYPES.includes(anomaly.type))) {
    throw new GuardrailError('unknown_anomaly_type');
  }
}

// Strips markdown symbols and collapses whitespace.
function cleanText(value) {
  return String(value ?? '')
    .replace(/[*_`#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function requireText(value, field, maxLength) {
  const text = cleanText(value);
  if (text === '') throw new GuardrailError(`empty_${field}`);
  if (text.length > maxLength) throw new GuardrailError(`${field}_too_long`);
  return text;
}

function requireTextList(value, field) {
  if (!Array.isArray(value) || value.length === 0) throw new GuardrailError(`missing_${field}`);
  return value.slice(0, ANALYSIS_LIMITS.maxListItems).map((item) => requireText(item, field, ANALYSIS_LIMITS.maxItemLength));
}

function requireSeverity(value) {
  const severity = cleanText(value).toLowerCase();
  if (!SEVERITY_LEVELS.includes(severity)) throw new GuardrailError('invalid_severity');
  return severity;
}

// Every number in the analysis must appear somewhere in the supplied context.
function requireGroundedNumbers(texts, context) {
  const allowed = new Set(JSON.stringify(context).match(NUMBER_PATTERN) ?? []);
  const used = texts.flatMap((text) => text.match(NUMBER_PATTERN) ?? []);
  if (!used.every((number) => allowed.has(number))) throw new GuardrailError('ungrounded_number');
}

function requireHedgedCauses(texts) {
  if (texts.some((text) => UNHEDGED_CAUSE_PATTERN.test(text))) throw new GuardrailError('unhedged_cause');
}

// Validates the parsed LLM analysis and returns a cleaned copy, or throws GuardrailError.
export function validateOutput(raw, context) {
  const analysis = {
    alert: requireText(raw?.alert, 'alert', ANALYSIS_LIMITS.maxAlertLength),
    severity: requireSeverity(raw?.severity),
    impact: requireText(raw?.impact, 'impact', ANALYSIS_LIMITS.maxSentenceLength),
    possible_causes: requireTextList(raw?.possible_causes, 'possible_causes'),
    recommended_checks: requireTextList(raw?.recommended_checks, 'recommended_checks'),
  };

  if (!analysis.alert.includes(context.api_name)) throw new GuardrailError('missing_api_name_in_alert');
  const allTexts = [analysis.alert, analysis.impact, ...analysis.possible_causes, ...analysis.recommended_checks];
  requireGroundedNumbers(allTexts, context);
  requireHedgedCauses([analysis.alert, analysis.impact, ...analysis.possible_causes]);
  return analysis;
}
