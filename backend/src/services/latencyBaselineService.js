// Loads each API's recent successful response times from the owner's saved monitoring
// history and summarizes them as a robust baseline { median_ms, scaled_mad_ms, samples }.
// Failed requests are excluded, so outages do not become "normal". Guests have no
// history, so they always get the configured SLO.
import { MonitoringRecord } from '../models/MonitoringRecord.js';
import { median, scaledMedianAbsoluteDeviation } from '../utils/robustStatistics.js';
import { logger } from '../utils/logger.js';

async function loadRecentResponseTimes(ownerId, apiName, policy) {
  const records = await MonitoringRecord.find({
    owner: ownerId,
    api_name: apiName,
    response_time_ms: { $ne: null },
    status_code: { $lt: policy.failedStatusMin },
  })
    .sort({ createdAt: -1 })
    .limit(policy.latency.baselineWindow)
    .select('response_time_ms')
    .lean();
  return records.map((record) => record.response_time_ms);
}

function summarize(responseTimes) {
  if (responseTimes.length === 0) return null;
  return {
    median_ms: Math.round(median(responseTimes)),
    scaled_mad_ms: Math.round(scaledMedianAbsoluteDeviation(responseTimes)),
    samples: responseTimes.length,
  };
}

async function loadBaseline(ownerId, apiName, policy) {
  return summarize(await loadRecentResponseTimes(ownerId, apiName, policy));
}

// Returns Map<api_name, baseline | null>. A database problem is logged and the affected
// observations fall back to the configured SLO, so monitoring still runs.
export async function loadLatencyBaselines(ownerId, apiNames, policy) {
  const baselines = new Map();
  if (!ownerId) return baselines;

  const uniqueNames = [...new Set(apiNames)];
  try {
    const summaries = await Promise.all(uniqueNames.map((apiName) => loadBaseline(ownerId, apiName, policy)));
    uniqueNames.forEach((apiName, position) => baselines.set(apiName, summaries[position]));
  } catch (error) {
    logger.error(`Loading latency baselines failed: ${error.name}: ${error.message}`);
  }
  return baselines;
}
