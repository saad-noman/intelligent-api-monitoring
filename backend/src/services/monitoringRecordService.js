// Persistence and retrieval of monitoring history. Every operation is scoped to the
// owning user; there is no unscoped query.
import { NotImplementedError } from '../utils/errors.js';

export async function saveRecords(ownerId, records) {
  throw new NotImplementedError('monitoringRecordService.saveRecords');
}

export async function listRecords(ownerId) {
  throw new NotImplementedError('monitoringRecordService.listRecords');
}
