// Coordinates the monitoring workflow for one submission:
//   1. Validate the payload (item-level errors never discard valid items).
//   2. anomalyDetectionService detects anomalies in each valid observation.
//   3. The ai-alert-generator module writes an alert for each anomalous observation
//      (LLM text, or the deterministic fallback template).
//   4. Guest (ownerId === null): return the transient results; nothing is persisted.
//      Authenticated: monitoringRecordService and alertStorageService persist the
//      results for ownerId, then emailNotificationService emails the anomaly report.
// A storage or email failure is logged and reported in the response; it never throws,
// because the analysis itself already succeeded.
// ownerId must come from the verified request identity, never from the request body.
import { getConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { validateObservations } from '../utils/observationValidation.js';
import { createAlertId } from '../utils/alertId.js';
import { detectAnomalies } from './anomalyDetectionService.js';
import { generateAlertExplanation } from '../modules/ai-alert-generator/index.js';
import { saveRecords } from './monitoringRecordService.js';
import { saveAnomalies } from './alertStorageService.js';
import { notifyAnomalies, EMAIL_STATUS } from './emailNotificationService.js';

export const PERSISTENCE_STATUS = { saved: 'saved', skipped: 'skipped', failed: 'failed' };

// Dependencies are injectable so tests can simulate database, LLM, and email failures.
const defaultDependencies = {
  getPolicy: () => getConfig().monitoring,
  explain: generateAlertExplanation,
  saveRecords,
  saveAnomalies,
  notifyAnomalies,
};

function isAnomalous(result) {
  return result.anomalies.length > 0;
}

// What the AI analysis receives: API name, observed metrics, and the rule findings.
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

async function evaluateObservation(observation, policy, deps, detectedAt) {
  const findings = detectAnomalies(observation, policy);
  const isIssue = findings.length > 0;
  const alert = isIssue ? await deps.explain(toAnalysisInput(observation, findings)) : null;

  return {
    // Every detected issue gets a unique ID; normal observations have none.
    alert_id: isIssue ? createAlertId(detectedAt) : null,
    index: observation.index,
    api_name: observation.api_name,
    response_time_ms: observation.response_time_ms,
    status_code: observation.status_code,
    records_returned: observation.records_returned,
    anomalies: findings,
    explanation: alert?.message ?? null,
    alert_source: alert?.source ?? null,
    // AI analysis { severity, impact, possible_causes, recommended_checks }; null for fallback alerts.
    analysis: alert?.analysis ?? null,
    ai_model: alert?.model ?? null,
    detected_at: detectedAt,
  };
}

// Sequential on purpose: keeps free-tier LLM rate limits from failing a whole batch.
async function evaluateAll(observations, policy, deps) {
  const detectedAt = new Date();
  const results = [];
  for (const observation of observations) {
    results.push(await evaluateObservation(observation, policy, deps, detectedAt));
  }
  return results;
}

async function persistResults(ownerId, results, deps) {
  if (!ownerId) {
    return { status: PERSISTENCE_STATUS.skipped, message: 'Guest results are not saved. Log in to store alerts.' };
  }
  try {
    const records = await deps.saveRecords(ownerId, results);
    const entries = results
      .map((result, position) => ({ recordId: records[position]._id, result }))
      .filter(({ result }) => isAnomalous(result));
    if (entries.length > 0) await deps.saveAnomalies(ownerId, entries);
    return {
      status: PERSISTENCE_STATUS.saved,
      message: `Saved ${results.length} observation(s) and ${entries.length} alert(s).`,
    };
  } catch (error) {
    logger.error(`Saving monitoring results failed: ${error.name}: ${error.message}`);
    return { status: PERSISTENCE_STATUS.failed, message: 'Results were analyzed but could not be saved. Please try again later.' };
  }
}

async function emailReport(ownerId, anomalous, persistence, deps) {
  if (persistence.status !== PERSISTENCE_STATUS.saved || anomalous.length === 0) {
    return { status: EMAIL_STATUS.skipped, message: 'No saved anomalies to report.' };
  }
  try {
    return await deps.notifyAnomalies(ownerId, anomalous);
  } catch (error) {
    logger.error(`Anomaly email failed: ${error.name}: ${error.message}`);
    return { status: EMAIL_STATUS.failed, message: 'The anomaly report email could not be sent.' };
  }
}

export async function runMonitoring(payload, { ownerId }, deps = defaultDependencies) {
  const policy = deps.getPolicy();
  const { observations, errors } = validateObservations(payload, policy);

  const results = await evaluateAll(observations, policy, deps);
  const anomalous = results.filter(isAnomalous);
  const persistence = await persistResults(ownerId, results, deps);
  const email = await emailReport(ownerId, anomalous, persistence, deps);

  return {
    summary: {
      received: observations.length + errors.length,
      valid: observations.length,
      invalid: errors.length,
      anomalous: anomalous.length,
    },
    results,
    errors,
    persistence,
    email,
  };
}
