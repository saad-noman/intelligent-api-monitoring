// Checks on the model's researched threshold. The key check is grounding: the threshold
// must be a number that a cited, actually retrieved source states (in ms, or in seconds
// converted to ms). Otherwise the answer is rejected and the model is asked to fix it.
import { GuardrailError } from './guardrailError.js';
import { cleanText } from './textCleaner.js';

export const THRESHOLD_LIMITS = { maxBasisLength: 300, maxReferences: 3 };

const NUMBER_PATTERN = /\d+(?:[.,]\d+)?/g;
const MS_PER_SECOND = 1000;

function requireThreshold(value, { minMs, maxMs }) {
  if (!Number.isInteger(value) || value < minMs || value > maxMs) {
    throw new GuardrailError('invalid_threshold', `"threshold_ms" must be an integer between ${minMs} and ${maxMs}.`);
  }
  return value;
}

function requireBasis(value) {
  const basis = cleanText(value);
  if (basis === '') throw new GuardrailError('empty_basis', '"basis" must be one sentence.');
  if (basis.length > THRESHOLD_LIMITS.maxBasisLength) {
    throw new GuardrailError('basis_too_long', `"basis" must be under ${THRESHOLD_LIMITS.maxBasisLength} characters.`);
  }
  if (/https?:\/\//i.test(basis)) throw new GuardrailError('url_in_output', 'Remove all URLs from "basis".');
  return basis;
}

// Cited IDs -> the retrieved sources (unknown or repeated IDs are rejected).
function requireCitedSources(value, sources) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new GuardrailError('missing_references', '"references" must cite at least one search result ID.');
  }
  const ids = [...new Set(value.slice(0, THRESHOLD_LIMITS.maxReferences).map((item) => String(item?.id ?? '').trim()))];
  return ids.map((id) => {
    const source = sources.get(id);
    if (!source) {
      const known = sources.ids().join(', ') || 'none';
      throw new GuardrailError('unknown_reference', `"${id}" is not a search result ID. Known IDs: ${known}.`);
    }
    return source;
  });
}

// Every value a source states, as milliseconds: "200" -> 200 (ms) and 200000 (if seconds).
function statedMilliseconds(source) {
  const text = `${source.title} ${source.snippet} ${source.details ?? ''}`;
  const numbers = (text.match(NUMBER_PATTERN) ?? []).map((number) => Number(number.replace(',', '.')));
  return new Set(numbers.flatMap((number) => [Math.round(number), Math.round(number * MS_PER_SECOND)]));
}

function requireStatedBySources(thresholdMs, citedSources) {
  const stated = citedSources.some((source) => statedMilliseconds(source).has(thresholdMs));
  if (!stated) {
    throw new GuardrailError(
      'threshold_not_in_sources',
      `No cited result states ${thresholdMs} ms. Choose a threshold that a cited result states explicitly.`,
    );
  }
}

// Returns { threshold_ms, basis, references: [{ title, url, site }] } or throws GuardrailError.
export function validateThresholdAnswer(raw, sources, limits) {
  const thresholdMs = requireThreshold(raw?.threshold_ms, limits);
  const basis = requireBasis(raw?.basis);
  const citedSources = requireCitedSources(raw?.references, sources);
  requireStatedBySources(thresholdMs, citedSources);

  return {
    threshold_ms: thresholdMs,
    basis,
    references: citedSources.map(({ title, url, site }) => ({ title, url, site })),
  };
}
