// Orchestrates one explanation:
//   build context -> validate input (guardrails) -> prompt the LLM provider
//   -> validate output (guardrails) -> return the explanation.
import { NotImplementedError } from '../../../utils/errors.js';

// Input: { apiResponse, anomaly } as supplied by the calling service.
export async function generateAlertExplanation({ apiResponse, anomaly }) {
  throw new NotImplementedError('ai-alert-generator.generateAlertExplanation');
}
