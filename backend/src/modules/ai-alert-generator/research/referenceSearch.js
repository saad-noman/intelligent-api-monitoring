// Searches every configured provider for one query and returns safe references:
// HTTPS links on allowed domains only, with plain, shortened text and no injection attempts.
// Providers run in parallel; one failing provider does not stop the others.
import { logger } from '../../../utils/logger.js';
import { isAllowedUrl, sanitizeSourceText } from '../guardrails/index.js';
import { ResearchError } from './httpClient.js';
import { createTtlCache } from './ttlCache.js';
import { createStackExchangeProvider } from './providers/stackExchangeProvider.js';
import { createSerperProvider } from './providers/serperProvider.js';

const TEXT_LIMITS = { title: 200, snippet: 500, details: 700 };
const CACHE_MAX_ENTRIES = 200;

function buildProviders(config) {
  const { stackExchange, serperApiKey, allowedDomains, maxResults, timeoutMs } = config;
  const providers = stackExchange.sites.map((site) =>
    createStackExchangeProvider({ site, apiKey: stackExchange.apiKey, maxResults, timeoutMs }),
  );
  if (serperApiKey) providers.push(createSerperProvider({ apiKey: serperApiKey, allowedDomains, maxResults, timeoutMs }));
  return providers;
}

// Untrusted provider result -> safe reference, or null when any part fails a check.
function toSafeReference(raw, allowedDomains) {
  if (!isAllowedUrl(raw.url, allowedDomains)) return null;
  const title = sanitizeSourceText(raw.title, TEXT_LIMITS.title);
  const snippet = sanitizeSourceText(raw.snippet, TEXT_LIMITS.snippet);
  const details = raw.details ? sanitizeSourceText(raw.details, TEXT_LIMITS.details) : null;
  if (!title || !snippet || (raw.details && !details)) return null;

  return { title, url: raw.url, site: new URL(raw.url).hostname, snippet, details, score: raw.score, accepted: raw.accepted };
}

// [[a1, a2], [b1]] -> [a1, b1, a2], so every provider is represented in the top results.
function interleave(lists) {
  const longest = Math.max(0, ...lists.map((list) => list.length));
  return Array.from({ length: longest }, (_, position) => lists.map((list) => list[position])).flat().filter(Boolean);
}

function uniqueByUrl(references) {
  const seen = new Set();
  return references.filter((reference) => !seen.has(reference.url) && seen.add(reference.url));
}

// Results of every provider that answered; throws only when all of them failed.
async function collectResults(query, providers) {
  const outcomes = await Promise.allSettled(providers.map((provider) => provider.search(query)));
  outcomes.forEach((outcome, position) => {
    if (outcome.status === 'rejected') {
      logger.warn(`Reference search with ${providers[position].name} failed: ${outcome.reason.reason ?? outcome.reason.message}.`);
    }
  });
  if (outcomes.every((outcome) => outcome.status === 'rejected')) throw new ResearchError('all_providers_failed');
  return outcomes.filter((outcome) => outcome.status === 'fulfilled').map((outcome) => outcome.value);
}

// Returns null when research is disabled or no provider is configured.
export function createReferenceSearch(config) {
  const providers = buildProviders(config);
  if (!config.enabled || providers.length === 0) return null;
  const cache = createTtlCache({ ttlMs: config.cacheTtlMs, maxEntries: CACHE_MAX_ENTRIES });

  return {
    providerNames: providers.map((provider) => provider.name),
    maxSearches: config.maxSearches,
    async search(query) {
      const cacheKey = query.toLowerCase();
      const cached = cache.get(cacheKey);
      if (cached) return cached;

      const resultLists = await collectResults(query, providers);
      const safeLists = resultLists.map((list) => list.map((raw) => toSafeReference(raw, config.allowedDomains)));
      const references = uniqueByUrl(interleave(safeLists)).slice(0, config.maxResults);
      cache.set(cacheKey, references);
      return references;
    },
  };
}
