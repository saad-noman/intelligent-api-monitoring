// Thin HTTP handlers for alert retrieval. Queries belong in services/alertQueryService.js.
import { NotImplementedError } from '../utils/errors.js';

// GET /alerts (requireAuth)
export function listActiveAlerts(req, res) {
  // TODO: Delegate to alertQueryService scoped to req.user.id.
  throw new NotImplementedError('GET /alerts');
}
