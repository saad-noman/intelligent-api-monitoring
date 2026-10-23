// Boundary for a future LLM integration. No provider or credentials have been selected.
// A concrete provider will implement: generate({ system, prompt }) -> Promise<string>.
import { NotImplementedError } from '../../../utils/errors.js';

export function createLlmProvider() {
  throw new NotImplementedError('ai-alert-generator LLM provider');
}
