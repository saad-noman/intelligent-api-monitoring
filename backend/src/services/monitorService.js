// Coordinates the monitoring workflow for one submission.
// Planned flow:
//   1. anomalyDetectionService detects anomalies in the supplied API responses.
//   2. The ai-alert-generator module explains each anomaly in human-readable form.
//   3. Guest (ownerId === null): return the transient results; nothing is persisted.
//      Authenticated: monitoringRecordService and alertStorageService persist the results
//      for ownerId, then emailNotificationService sends the alert.
// ownerId must come from the verified request identity, never from the request body.
import { NotImplementedError } from '../utils/errors.js';

export async function runMonitoring(apiResponses, { ownerId }) {
  throw new NotImplementedError('monitorService.runMonitoring');
}
