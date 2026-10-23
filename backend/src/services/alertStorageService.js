// Persists detected anomalies, with their explanations, for the owning user.
import { NotImplementedError } from '../utils/errors.js';

export async function saveAnomalies(ownerId, anomalies) {
  throw new NotImplementedError('alertStorageService.saveAnomalies');
}
