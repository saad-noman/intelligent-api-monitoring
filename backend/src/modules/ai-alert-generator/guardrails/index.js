// Future input validation, content-scope restrictions (API-anomaly explanations only),
// and output validation for generated explanations.
import { NotImplementedError } from '../../../utils/errors.js';

export function validateInput(context) {
  throw new NotImplementedError('ai-alert-generator.validateInput');
}

export function validateOutput(explanation, context) {
  throw new NotImplementedError('ai-alert-generator.validateOutput');
}
