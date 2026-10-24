// Researches the response-time threshold for one API:
//   the model searches Google (allow-listed latency-guidance sites) through a tool ->
//   picks a threshold that a retrieved source states -> guardrails verify it is grounded.
// An answer that fails a guardrail is sent back with the reason (up to `repairAttempts`).
// Returns { status: "completed", threshold_ms, basis, references, model } or
// { status: "unavailable", reason } — the caller then uses its own fallback threshold.
import { getConfig } from '../../../config/env.js';
import { GuardrailError, validateThresholdAnswer } from '../guardrails/index.js';
import { parseAnalysis } from '../output/analysisParser.js';
import { buildRepairPrompt } from '../prompts/index.js';
import { buildThresholdSystemPrompt, buildThresholdUserPrompt } from '../prompts/thresholdPrompts.js';
import { createLlmProvider } from '../providers/llmProvider.js';
import { createSourceRegistry, getThresholdSearch } from '../research/index.js';
import { THRESHOLD_SEARCH_TOOL } from '../tools/thresholdSearchTool.js';
import { createConversation } from './conversation.js';
import { runWithModels } from './modelRunner.js';

export const THRESHOLD_STATUS = { completed: 'completed', unavailable: 'unavailable' };

function unavailable(reason) {
  return { status: THRESHOLD_STATUS.unavailable, reason };
}

function buildMessages(apiName, settings) {
  const { thresholdSearch, limits } = settings;
  return [
    { role: 'system', content: buildThresholdSystemPrompt({ maxSearches: thresholdSearch.maxSearches, ...limits }) },
    { role: 'user', content: buildThresholdUserPrompt(apiName) },
  ];
}

// One model's research; returns the validated answer or throws.
async function researchWithModel(model, apiName, settings) {
  const { llm, thresholdSearch, limits, repairAttempts } = settings;
  const sources = createSourceRegistry();
  const research = { referenceSearch: thresholdSearch, sources, context: { api_name: apiName }, tool: THRESHOLD_SEARCH_TOOL };
  const conversation = createConversation({ llm, model, messages: buildMessages(apiName, settings), research });

  for (let repair = 0; ; repair += 1) {
    const text = await conversation.ask();
    try {
      return validateThresholdAnswer(parseAnalysis(text), sources, limits);
    } catch (error) {
      if (!(error instanceof GuardrailError) || repair >= repairAttempts) throw error;
      conversation.addFeedback(buildRepairPrompt(error));
    }
  }
}

// Configuration, with optional overrides (e.g. in tests). A null thresholdSearch means "no Google search".
function resolveSettings({ provider, models, thresholdSearch } = {}) {
  const { llm: llmConfig, research } = getConfig();
  return {
    llm: provider ?? createLlmProvider(llmConfig),
    models: models ?? llmConfig.models,
    thresholdSearch: thresholdSearch === undefined ? getThresholdSearch() : thresholdSearch,
    limits: { minMs: research.threshold.minMs, maxMs: research.threshold.maxMs },
    retries: llmConfig.retries,
    retryDelayMs: llmConfig.retryDelayMs,
    repairAttempts: llmConfig.repairAttempts,
  };
}

export async function researchLatencyThreshold(apiName, overrides = {}) {
  const settings = resolveSettings(overrides);
  if (!settings.llm) return unavailable('llm_not_configured');
  if (!settings.thresholdSearch) return unavailable('google_search_not_configured');

  const { result, model, errors } = await runWithModels({
    models: settings.models,
    attempt: (candidate) => researchWithModel(candidate, apiName, settings),
    retries: settings.retries,
    retryDelayMs: settings.retryDelayMs,
    taskName: `Threshold research for ${apiName}`,
  });
  if (!result) return unavailable(errors.join('; '));
  return { status: THRESHOLD_STATUS.completed, ...result, model };
}
