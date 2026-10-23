// Identifies anomalies from response time, status code, and records returned.
// Pure logic: no database access, no HTTP concerns, no AI calls.
import { NotImplementedError } from '../utils/errors.js';

export function detectAnomalies(apiResponses) {
  throw new NotImplementedError('anomalyDetectionService.detectAnomalies');
}
