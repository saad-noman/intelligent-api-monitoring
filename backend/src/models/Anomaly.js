// A detected anomaly saved for an authenticated user (guest anomalies are never stored).
// One document per anomalous observation; `findings` lists every rule that fired with
// its exact evidence, and `alert_message` is the AI-written alert text (null when the AI
// analysis failed; `analysis_error` then says why and the analysis can be run again).
import mongoose from 'mongoose';
import { ANALYSIS_STATUS } from '../modules/ai-alert-generator/index.js';

const { Schema } = mongoose;

const findingSchema = new Schema(
  {
    type: { type: String, required: true },
    rule: { type: String, required: true },
    observed: { type: Schema.Types.Mixed, required: true },
    threshold: { type: Number, default: undefined },
    // HIGH_RESPONSE_TIME: how the threshold was chosen, the learned baseline, and the user impact band.
    threshold_source: { type: String, default: undefined },
    baseline: { type: Schema.Types.Mixed, default: undefined },
    user_impact: { type: String, default: undefined },
    // HIGH_RESPONSE_TIME with researched guidance: { threshold_ms, basis, references, model }.
    research: { type: Schema.Types.Mixed, default: undefined },
    // FAILED_REQUEST: RFC 9110 status class (client_error / server_error).
    status_class: { type: String, default: undefined },
  },
  { _id: false },
);

// A web source the AI analysis relied on; title and URL come from the search results, never from the model.
const referenceSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    site: { type: String, required: true },
    relevance: { type: String, required: true },
  },
  { _id: false },
);

// AI analysis of the anomaly (null when the analysis failed).
const analysisSchema = new Schema(
  {
    severity: { type: String, required: true },
    impact: { type: String, required: true },
    possible_causes: { type: [String], required: true },
    recommended_checks: { type: [String], required: true },
    // How the web research compares with the evidence; null when research was off.
    research_summary: { type: String, default: null },
    references: { type: [referenceSchema], default: [] },
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
    alert_message: { type: String, default: null },
    analysis_status: { type: String, enum: Object.values(ANALYSIS_STATUS), required: true },
    // Why each model failed (secret-free reasons), when analysis_status is "failed".
    analysis_error: { type: String, default: null },
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
