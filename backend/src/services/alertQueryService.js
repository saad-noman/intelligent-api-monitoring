// Read-only retrieval of the owning user's active anomalies.
import { NotImplementedError } from '../utils/errors.js';

export async function listActiveAlerts(ownerId) {
  throw new NotImplementedError('alertQueryService.listActiveAlerts');
}
