// Runs the AI analysis for an anomalous observation and maps its result to alert fields.
// Shared by new submissions (monitorService) and by re-running the analysis of a saved
// alert (POST /alerts/:alertId/analyze), e.g. after a provider outage or rate limit.
import { generateAlertExplanation } from '../modules/ai-alert-generator/index.js';
import { findOwnedAnomaly, saveAlertAnalysis } from './alertStorageService.js';

// Analysis fields of an observation without anomalies.
export const NO_ANALYSIS_FIELDS = Object.freeze({
  explanation: null,
  analysis_status: null,
  analysis_error: null,
  analysis: null,
  ai_model: null,
});

// What the AI analysis receives: API name, observed metrics, and the rule findings.
// `observation` is a validated observation or a saved alert (both use the same field names).
function toAnalysisInput(observation, findings) {
  return {
    apiName: observation.api_name,
    metrics: {
      response_time_ms: observation.response_time_ms,
      status_code: observation.status_code,
      records_returned: observation.records_returned,
    },
    findings,
  };
}

// { explanation, analysis_status, analysis_error, analysis, ai_model }
function toAnalysisFields(result) {
  return {
    explanation: result.message,
    analysis_status: result.status,
    analysis_error: result.error,
    analysis: result.analysis,
    ai_model: result.model,
  };
}

// `explain` is injectable so tests can replace the AI module.
export async function analyzeAnomaly(observation, findings, explain = generateAlertExplanation) {
  return toAnalysisFields(await explain(toAnalysisInput(observation, findings)));
}

// Runs the analysis of one saved alert again and stores the new result.
// Returns the updated alert view, or null when the owner has no such alert.
export async function reanalyzeAlert(ownerId, alertId) {
  const anomaly = await findOwnedAnomaly(ownerId, alertId);
  if (!anomaly) return null;
  const fields = await analyzeAnomaly(anomaly, anomaly.findings);
  return saveAlertAnalysis(ownerId, alertId, fields);
}
