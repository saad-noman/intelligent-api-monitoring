// Checks the context before it is sent to the LLM. api_name is free text from the
// submitter, so it is the field that could carry an injected instruction.
import { ANOMALY_TYPES } from '../../../services/anomalyDetectionService.js';
import { GuardrailError } from './guardrailError.js';
import { containsInjection } from './injectionDetector.js';

const KNOWN_TYPES = Object.values(ANOMALY_TYPES);

export function validateInput(context) {
  if (typeof context.api_name !== 'string' || context.api_name === '') throw new GuardrailError('missing_api_name');
  if (containsInjection(context.api_name)) throw new GuardrailError('injection_in_api_name');
  if (context.anomalies.length === 0) throw new GuardrailError('no_anomalies');
  if (!context.anomalies.every((anomaly) => KNOWN_TYPES.includes(anomaly.type))) {
    throw new GuardrailError('unknown_anomaly_type');
  }
}
