// Web research for the alert agent: searches reliable technical sources so the model
// can compare how similar symptoms were diagnosed elsewhere with the observed evidence.
import { getConfig } from '../../../config/env.js';
import { createReferenceSearch } from './referenceSearch.js';

export { createReferenceSearch } from './referenceSearch.js';
export { createSourceRegistry } from './sourceRegistry.js';
export { ResearchError } from './httpClient.js';

// One shared instance, so its cache serves every analysis. Null when research is off.
let sharedReferenceSearch;

export function getReferenceSearch() {
  if (sharedReferenceSearch === undefined) sharedReferenceSearch = createReferenceSearch(getConfig().research);
  return sharedReferenceSearch;
}

// Google-only search over the latency-guidance domains, for the threshold research.
// Stack Exchange is left out: thresholds should come from published guidance, not Q&A.
function buildThresholdSearchConfig(research) {
  return {
    ...research,
    enabled: research.enabled && research.threshold.enabled,
    stackExchange: { sites: [], apiKey: null },
    allowedDomains: research.threshold.allowedDomains,
  };
}

// One shared instance with its own cache. Null when research is off or SERPER_API_KEY is missing.
let sharedThresholdSearch;

export function getThresholdSearch() {
  if (sharedThresholdSearch === undefined) {
    sharedThresholdSearch = createReferenceSearch(buildThresholdSearchConfig(getConfig().research));
  }
  return sharedThresholdSearch;
}
