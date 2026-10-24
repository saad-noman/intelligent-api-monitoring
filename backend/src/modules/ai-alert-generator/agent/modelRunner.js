// Runs one AI task against the configured models in order: temporary errors (rate limit,
// timeout, provider 5xx) are retried on the same model, other errors move on to the next
// model. Returns { result, model } from the first success, or { result: null, errors }.
import { logger } from '../../../utils/logger.js';
import { isTemporaryError } from '../providers/llmProvider.js';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptWithRetries(model, attempt, { retries, retryDelayMs }) {
  for (let tryNumber = 0; ; tryNumber += 1) {
    try {
      return await attempt(model);
    } catch (error) {
      if (tryNumber >= retries || !isTemporaryError(error)) throw error;
      await wait(retryDelayMs);
    }
  }
}

// `attempt(model)` resolves to the task result or throws. `taskName` is used in log lines.
export async function runWithModels({ models, attempt, retries, retryDelayMs, taskName }) {
  const errors = [];
  for (const model of models) {
    try {
      return { result: await attemptWithRetries(model, attempt, { retries, retryDelayMs }), model, errors };
    } catch (error) {
      const reason = error.reason ?? error.message;
      logger.warn(`${taskName} with ${model} failed: ${reason}.`);
      errors.push(`${model}: ${reason}`);
    }
  }
  return { result: null, model: null, errors };
}
