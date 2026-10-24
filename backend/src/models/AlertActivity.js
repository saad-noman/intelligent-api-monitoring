// A record of an action a user performed on one of their alerts (resolved, reopened,
// emailed), with a snapshot of the alert. When an alert is deleted, its history entries
// are deleted too. Queries are always scoped by owner.
import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ACTIVITY_ACTIONS = {
  resolved: 'resolved',
  reopened: 'reopened',
  emailed: 'emailed',
};

const alertActivitySchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: Object.values(ACTIVITY_ACTIONS), required: true },
    // Snapshot of the alert at the time of the action.
    alert_id: { type: String, required: true },
    api_name: { type: String, required: true },
    alert_message: { type: String, default: null },
    anomaly_types: { type: [String], default: [] },
    severity: { type: String, default: null },
    // Optional short note, e.g. the recipient of an emailed alert.
    details: { type: String, default: null },
  },
  { timestamps: true },
);

// Supports the history page: the owner's activity, newest first.
alertActivitySchema.index({ owner: 1, createdAt: -1 });

export const AlertActivity = mongoose.model('AlertActivity', alertActivitySchema);
