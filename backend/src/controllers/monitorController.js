// Thin HTTP handlers for monitoring. Detection, explanation, and persistence are
// coordinated by services/monitorService.js.
import { NotImplementedError } from '../utils/errors.js';

// POST /monitor (optionalAuth)
export function submitMonitoring(req, res) {
  // TODO: Validate the monitoring input and delegate to monitorService.
  // Guest (req.user === null): return transient results only; nothing is persisted.
  // Authenticated: results are persisted for req.user.id, never for a client-supplied ID.
  throw new NotImplementedError('POST /monitor');
}

// GET /monitor/records (requireAuth)
export function listMonitoringRecords(req, res) {
  // TODO: Delegate to monitoringRecordService scoped to req.user.id.
  throw new NotImplementedError('GET /monitor/records');
}
