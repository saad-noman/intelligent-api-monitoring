// Orchestrates one AI analysis:
//   build context -> validate input -> for each configured model:
//   chat with the LLM (which may search reference sources through a tool) -> parse JSON
//   -> validate output (guardrails) -> return the analysis.
// An answer that fails a guardrail is sent back to the same model with the reason, so it
// can correct itself (up to `repairAttempts` times). A model that still fails (timeout,
// rate limit, unavailable, rejected answer) is skipped and the next model is asked.
// No text is ever written without the AI: when every model fails, the result has status
// "failed" with the reasons, and the analysis can be run again later.
import { getConfig } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import { buildAlertContext } from '../context/alertContextBuilder.js';
import { GuardrailError, validateInput, validateOutput } from '../guardrails/index.js';
import { parseAnalysis } from '../output/analysisParser.js';
import { buildSystemPrompt, buildAlertPrompt, buildRepairPrompt } from '../prompts/index.js';
import { createLlmProvider, isTemporaryError } from '../providers/llmProvider.js';
import { createSourceRegistry, getReferenceSearch } from '../research/index.js';
import { createConversation } from './conversation.js';

export const ANALYSIS_STATUS = { completed: 'completed', failed: 'failed' };

function completed(model, { alert, ...analysis }) {
  return { status: ANALYSIS_STATUS.completed, message: alert, model, analysis, error: null };
}

function failed(input, error) {
  logger.warn(`AI analysis failed for ${input.apiName}: ${error}.`);
  return { status: ANALYSIS_STATUS.failed, message: null, model: null, analysis: null, error };
}

function buildMessages(context, referenceSearch) {
  return [
    { role: 'system', content: buildSystemPrompt(referenceSearch) },
    { role: 'user', content: buildAlertPrompt(context) },
  ];
}

// Parses and validates one reply; returns the analysis or throws GuardrailError.
function readAnswer(text, context, sources) {
  return validateOutput(parseAnalysis(text), context, sources);
}

// Asks one model and returns its validated analysis, or throws. Each attempt has its own
// source registry, so the model can only cite results it received in this conversation.
async function analyzeWithModel(llm, model, context, settings) {
  const { referenceSearch, repairAttempts } = settings;
  const sources = referenceSearch ? createSourceRegistry() : null;
  const research = referenceSearch ? { referenceSearch, sources, context } : null;
  const conversation = createConversation({ llm, model, messages: buildMessages(context, referenceSearch), research });

  for (let repair = 0; ; repair += 1) {
    const text = await conversation.ask();
    try {
      return completed(model, readAnswer(text, context, sources));
    } catch (error) {
      if (!(error instanceof GuardrailError) || repair >= repairAttempts) throw error;
      logger.info(`Asking ${model} to correct its answer: ${error.reason}.`);
      conversation.addFeedback(buildRepairPrompt(error));
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Asks one model, retrying temporary errors up to `retries` times; throws the last error.
async function analyzeWithRetries(llm, model, context, settings) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await analyzeWithModel(llm, model, context, settings);
    } catch (error) {
      if (attempt >= settings.retries || !isTemporaryError(error)) throw error;
      await wait(settings.retryDelayMs);
    }
  }
}

// Configuration, with optional overrides (e.g. in tests). A null referenceSearch means "no web research".
function resolveSettings({ provider, models, referenceSearch }) {
  const llmConfig = getConfig().llm;
  return {
    llm: provider ?? createLlmProvider(llmConfig),
    models: models ?? llmConfig.models,
    referenceSearch: referenceSearch === undefined ? getReferenceSearch() : referenceSearch,
    retries: llmConfig.retries,
    retryDelayMs: llmConfig.retryDelayMs,
    repairAttempts: llmConfig.repairAttempts,
  };
}

// Input: { apiName, metrics, findings } from the monitoring service.
// Returns { status, message, model, analysis, error }; `error` lists why each model failed.
export async function generateAlertExplanation(input, overrides = {}) {
  const settings = resolveSettings(overrides);
  const context = buildAlertContext(input);
  try {
    validateInput(context);
  } catch (error) {
    return failed(input, error.reason);
  }

  const modelErrors = [];
  for (const model of settings.models) {
    try {
      return await analyzeWithRetries(settings.llm, model, context, settings);
    } catch (error) {
      const reason = error.reason ?? error.message;
      logger.warn(`AI analysis with ${model} failed for ${input.apiName}: ${reason}.`);
      modelErrors.push(`${model}: ${reason}`);
    }
  }
  return failed(input, modelErrors.join('; '));
}
