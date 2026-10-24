// Orchestrates one AI analysis:
//   build context -> validate input -> for each configured model:
//   prompt the LLM -> parse JSON -> validate output (guardrails) -> return the analysis.
// A model that fails (timeout, rate limit, unavailable, ungrounded answer) is skipped and
// the next model is asked. Only when every model fails is the factual fallback used, so
// monitoring and storage always continue.
import { getConfig } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import { buildAlertContext } from '../context/alertContextBuilder.js';
import { validateInput, validateOutput } from '../guardrails/index.js';
import { parseAnalysis } from '../output/analysisParser.js';
import { ALERT_SYSTEM_PROMPT, buildAlertPrompt } from '../prompts/index.js';
import { createLlmProvider, isTemporaryError } from '../providers/llmProvider.js';
import { buildFallbackAlert } from '../fallback/fallbackTemplate.js';

export const ALERT_SOURCES = { llm: 'llm', fallback: 'fallback' };

function fallback(input, reason) {
  logger.warn(`Using fallback alert for ${input.apiName}: ${reason}.`);
  return { message: buildFallbackAlert(input), source: ALERT_SOURCES.fallback, model: null, analysis: null };
}

// Asks one model and returns its validated analysis, or throws.
async function analyzeWithModel(llm, model, context) {
  const text = await llm.generate({ model, system: ALERT_SYSTEM_PROMPT, prompt: buildAlertPrompt(context) });
  const { alert, ...analysis } = validateOutput(parseAnalysis(text), context);
  return { message: alert, source: ALERT_SOURCES.llm, model, analysis };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Asks one model, retrying temporary errors up to `retries` times; throws the last error.
async function analyzeWithRetries(llm, model, context, { retries, retryDelayMs }) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await analyzeWithModel(llm, model, context);
    } catch (error) {
      if (attempt >= retries || !isTemporaryError(error)) throw error;
      await wait(retryDelayMs);
    }
  }
}

// Input: { apiName, metrics, findings } from the monitoring service.
// `provider` and `models` can be injected (e.g. in tests); null provider means "no LLM configured".
export async function generateAlertExplanation(input, { provider, models } = {}) {
  const llmConfig = provider === undefined || models === undefined ? getConfig().llm : null;
  const llm = provider === undefined ? createLlmProvider(llmConfig) : provider;
  const modelList = models ?? llmConfig.models;
  const retryPolicy = { retries: llmConfig?.retries ?? 0, retryDelayMs: llmConfig?.retryDelayMs ?? 0 };
  if (!llm) return fallback(input, 'llm_not_configured');

  const context = buildAlertContext(input);
  try {
    validateInput(context);
  } catch (error) {
    return fallback(input, error.reason);
  }

  for (const model of modelList) {
    try {
      return await analyzeWithRetries(llm, model, context, retryPolicy);
    } catch (error) {
      logger.warn(`AI analysis with ${model} failed for ${input.apiName}: ${error.reason ?? error.message}.`);
    }
  }
  return fallback(input, 'all_models_failed');
}
