// A detected anomaly saved for an authenticated user (guest anomalies are never stored).
// One document per anomalous observation; `findings` lists every rule that fired with
// its exact evidence, and `alert_message` is the LLM text or the fallback template.
import mongoose from 'mongoose';

const { Schema } = mongoose;

const findingSchema = new Schema(
  {
    type: { type: String, required: true },
    rule: { type: String, required: true },
    observed: { type: Schema.Types.Mixed, required: true },
    threshold: { type: Number, default: undefined },
  },
  { _id: false },
);

// AI analysis of the anomaly (absent when the fallback text was used).
const analysisSchema = new Schema(
  {
    severity: { type: String, required: true },
    impact: { type: String, required: true },
    possible_causes: { type: [String], required: true },
    recommended_checks: { type: [String], required: true },
  },
  { _id: false },
);

const anomalySchema = new Schema(
  {
    // Human-readable unique issue ID shown in the UI and used for search (utils/alertId.js).
    // Sparse so documents saved before IDs existed do not block building the unique index.
    alert_id: { type: String, required: true, unique: true, sparse: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    monitoring_record: { type: Schema.Types.ObjectId, ref: 'MonitoringRecord', required: true },
    api_name: { type: String, required: true, trim: true },
    response_time_ms: { type: Number, default: null },
    status_code: { type: Number, default: null },
    records_returned: { type: Number, default: null },
    anomaly_types: { type: [String], required: true },
    findings: { type: [findingSchema], required: true },
    alert_message: { type: String, required: true },
    alert_source: { type: String, enum: ['llm', 'fallback'], required: true },
    analysis: { type: analysisSchema, default: null },
    // The OpenRouter model that produced the analysis.
    ai_model: { type: String, default: null },
    active: { type: Boolean, default: true },
    detected_at: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Supports GET /alerts: the owner's active anomalies, newest first.
anomalySchema.index({ owner: 1, active: 1, detected_at: -1 });

export const Anomaly = mongoose.model('Anomaly', anomalySchema);
