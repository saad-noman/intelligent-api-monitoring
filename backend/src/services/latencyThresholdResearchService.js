// Gets the AI-researched response-time threshold for each API in a submission. Each API
// is researched at most once per cache period (RESEARCH_CACHE_TTL_MINUTES); only
// successful research is cached, so a failure is retried on the next submission.
// Research works for guests too, since it needs no saved history.
import { getConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { createTtlCache, researchLatencyThreshold, THRESHOLD_STATUS } from '../modules/ai-alert-generator/index.js';

const CACHE_MAX_ENTRIES = 200;

let cache;

function getCache() {
  if (!cache) cache = createTtlCache({ ttlMs: getConfig().research.cacheTtlMs, maxEntries: CACHE_MAX_ENTRIES });
  return cache;
}

// Returns { threshold_ms, basis, references, model } or null when research is unavailable.
async function researchOne(apiName) {
  const key = apiName.toLowerCase();
  const cached = getCache().get(key);
  if (cached) return cached;

  const outcome = await researchLatencyThreshold(apiName);
  if (outcome.status !== THRESHOLD_STATUS.completed) {
    logger.warn(`Threshold research unavailable for ${apiName}: ${outcome.reason}. Using the fallback threshold.`);
    return null;
  }
  const researched = {
    threshold_ms: outcome.threshold_ms,
    basis: outcome.basis,
    references: outcome.references,
    model: outcome.model,
  };
  getCache().set(key, researched);
  return researched;
}

// Returns Map<api_name, researched threshold | null>. Sequential, to respect LLM rate limits.
// An unexpected error is logged and the affected API falls back, so monitoring still runs.
export async function loadResearchedThresholds(apiNames) {
  const thresholds = new Map();
  for (const apiName of new Set(apiNames)) {
    try {
      thresholds.set(apiName, await researchOne(apiName));
    } catch (error) {
      logger.error(`Threshold research failed for ${apiName}: ${error.name}: ${error.message}`);
      thresholds.set(apiName, null);
    }
  }
  return thresholds;
}
