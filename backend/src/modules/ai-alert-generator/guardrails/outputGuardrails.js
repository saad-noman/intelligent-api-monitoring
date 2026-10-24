// Checks the parsed LLM answer. A failed check raises GuardrailError with a `detail` that
// the agent sends back to the model so it can correct its answer; an answer that still
// fails is never shown to the user.
import { GuardrailError } from './guardrailError.js';
import { containsInjection } from './injectionDetector.js';
import { cleanText } from './textCleaner.js';

// Digits glued to letters (source IDs such as "S1") are not counted as numbers.
const NUMBER_PATTERN = /(?<![A-Za-z])\d+(?:\.\d+)?/g;
// Phrases that assert a cause as fact instead of hedging it.
const UNHEDGED_CAUSE_PATTERN = /\b(caused by|due to|because of|the root cause|the cause is)\b/i;
// Links are only ever taken from the retrieved sources, never written by the model.
const URL_PATTERN = /\bhttps?:\/\/|\bwww\./i;

export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

export const ANALYSIS_LIMITS = {
  maxAlertLength: 400,
  maxSentenceLength: 250,
  maxItemLength: 200,
  maxListItems: 3,
};

function requireText(value, field, maxLength) {
  const text = cleanText(value);
  if (text === '') throw new GuardrailError(`empty_${field}`, `"${field}" is missing or empty.`);
  if (text.length > maxLength) {
    throw new GuardrailError(`${field}_too_long`, `"${field}" must be at most ${maxLength} characters.`);
  }
  return text;
}

function requireTextList(value, field) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new GuardrailError(`missing_${field}`, `"${field}" must be a non-empty list of strings.`);
  }
  return value.slice(0, ANALYSIS_LIMITS.maxListItems).map((item) => requireText(item, field, ANALYSIS_LIMITS.maxItemLength));
}

function requireSeverity(value) {
  const severity = cleanText(value).toLowerCase();
  if (!SEVERITY_LEVELS.includes(severity)) {
    throw new GuardrailError('invalid_severity', `"severity" must be one of: ${SEVERITY_LEVELS.join(', ')}.`);
  }
  return severity;
}

// One cited source: its ID must be one the model actually received in this analysis.
function resolveReference(item, sources, citedIds) {
  const id = cleanText(item?.id);
  const source = sources.get(id);
  if (!source) {
    const known = sources.ids().join(', ') || 'none';
    throw new GuardrailError('unknown_reference', `Reference "${id}" was not in the search results. Known result IDs: ${known}.`);
  }
  if (citedIds.has(source.id)) throw new GuardrailError('duplicate_reference', `Reference ${source.id} is listed twice.`);
  citedIds.add(source.id);
  return {
    title: source.title,
    url: source.url,
    site: source.site,
    relevance: requireText(item.relevance, 'reference_relevance', ANALYSIS_LIMITS.maxItemLength),
  };
}

// `sources` is the source registry of this analysis, or null when research is off.
function requireReferences(value, sources) {
  if (!sources) return [];
  if (!Array.isArray(value)) {
    throw new GuardrailError('missing_references', '"references" must be a list ([] when no result matched).');
  }
  const citedIds = new Set();
  return value.slice(0, ANALYSIS_LIMITS.maxListItems).map((item) => resolveReference(item, sources, citedIds));
}

function requireResearchSummary(value, sources) {
  if (!sources) return null;
  return requireText(value, 'research_summary', ANALYSIS_LIMITS.maxSentenceLength);
}

function requireApiName(alert, apiName) {
  if (!alert.includes(apiName)) {
    throw new GuardrailError('missing_api_name_in_alert', `"alert" must name the API exactly as "${apiName}".`);
  }
}

// Every number in the analysis must appear somewhere in the supplied context.
function requireGroundedNumbers(texts, context) {
  const allowed = new Set(JSON.stringify(context).match(NUMBER_PATTERN) ?? []);
  const used = texts.flatMap((text) => text.match(NUMBER_PATTERN) ?? []);
  const ungrounded = [...new Set(used.filter((number) => !allowed.has(number)))];
  if (ungrounded.length > 0) {
    throw new GuardrailError(
      'ungrounded_number',
      `These numbers are not in the evidence JSON: ${ungrounded.join(', ')}. Remove them; use only numbers from the JSON.`,
    );
  }
}

function requireHedgedCauses(texts) {
  const match = texts.map((text) => text.match(UNHEDGED_CAUSE_PATTERN)).find(Boolean);
  if (match) {
    throw new GuardrailError(
      'unhedged_cause',
      `"${match[0]}" states a cause as fact. Rephrase causes and impact as possibilities ("may", "could", "may indicate").`,
    );
  }
}

function requireNoUrls(texts) {
  if (texts.some((text) => URL_PATTERN.test(text))) {
    throw new GuardrailError('url_in_output', 'Remove all URLs; cite search results only by their ID in "references".');
  }
}

function requireNoInstructionEcho(texts) {
  if (texts.some(containsInjection)) {
    throw new GuardrailError('instruction_in_output', 'Remove instruction-like text; describe only the anomaly.');
  }
}

// Validates the parsed LLM analysis and returns a cleaned copy, or throws GuardrailError.
export function validateOutput(raw, context, sources = null) {
  const analysis = {
    alert: requireText(raw?.alert, 'alert', ANALYSIS_LIMITS.maxAlertLength),
    severity: requireSeverity(raw?.severity),
    impact: requireText(raw?.impact, 'impact', ANALYSIS_LIMITS.maxSentenceLength),
    possible_causes: requireTextList(raw?.possible_causes, 'possible_causes'),
    recommended_checks: requireTextList(raw?.recommended_checks, 'recommended_checks'),
    research_summary: requireResearchSummary(raw?.research_summary, sources),
    references: requireReferences(raw?.references, sources),
  };

  requireApiName(analysis.alert, context.api_name);
  const claims = [analysis.alert, analysis.impact, ...analysis.possible_causes];
  const modelTexts = [
    ...claims,
    ...analysis.recommended_checks,
    ...(analysis.research_summary ? [analysis.research_summary] : []),
    ...analysis.references.map((reference) => reference.relevance),
  ];
  requireGroundedNumbers(modelTexts, context);
  requireHedgedCauses(claims);
  requireNoUrls(modelTexts);
  requireNoInstructionEcho(modelTexts);
  return analysis;
}
