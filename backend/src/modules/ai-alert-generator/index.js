// Public interface of the AI alert-generation module. Its sole purpose is producing
// accurate, human-readable explanations of detected API anomalies; its web research is
// limited to looking up the detected symptoms on allow-listed technical sources.
//
// Callers (services, never controllers) pass all needed context explicitly. The module
// does not access the database or HTTP request objects.
export { generateAlertExplanation, ANALYSIS_STATUS } from './agent/alertAgent.js';
export { getReferenceSearch } from './research/index.js';
export { createTtlCache } from './research/ttlCache.js';
export { researchLatencyThreshold, THRESHOLD_STATUS } from './agent/thresholdAgent.js';
