// Organizes the supplied API input (api_name, response_time_ms, status_code,
// records_returned) and the detected anomaly into the context given to the LLM.
// Only explicitly supplied data is included.
import { NotImplementedError } from '../../../utils/errors.js';

export function buildAlertContext({ apiResponse, anomaly }) {
  throw new NotImplementedError('ai-alert-generator.buildAlertContext');
}
