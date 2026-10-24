// A saved monitoring observation for an authenticated user (guest results are never
// stored). The owner is set from the verified server-side identity; queries are always
// scoped by owner. Response bodies are never stored.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const monitoringRecordSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    api_name: { type: String, required: true, trim: true },
    // Null means the value was missing from the submitted observation.
    response_time_ms: { type: Number, default: null },
    status_code: { type: Number, default: null },
    records_returned: { type: Number, default: null },
    anomaly_count: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const MonitoringRecord = mongoose.model('MonitoringRecord', monitoringRecordSchema);
