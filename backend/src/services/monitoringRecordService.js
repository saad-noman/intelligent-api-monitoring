// Persistence and retrieval of monitoring history. Every operation is scoped to the
// owning user; there is no unscoped query.
import { MonitoringRecord } from '../models/MonitoringRecord.js';

const HISTORY_LIMIT = 200;

// `results` are monitorService results; only the documented metric fields are stored.
// Returns the saved documents in the same order as `results`.
export async function saveRecords(ownerId, results) {
  const documents = results.map((result) => ({
    owner: ownerId,
    api_name: result.api_name,
    response_time_ms: result.response_time_ms,
    status_code: result.status_code,
    records_returned: result.records_returned,
    anomaly_count: result.anomalies.length,
  }));
  return MonitoringRecord.insertMany(documents);
}

export async function listRecords(ownerId) {
  const records = await MonitoringRecord.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(HISTORY_LIMIT).lean();
  return records.map((record) => ({
    id: record._id.toString(),
    api_name: record.api_name,
    response_time_ms: record.response_time_ms,
    status_code: record.status_code,
    records_returned: record.records_returned,
    anomaly_count: record.anomaly_count,
    created_at: record.createdAt,
  }));
}
