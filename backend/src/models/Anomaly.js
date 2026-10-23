// TODO: Define and export the Mongoose Anomaly model.
// Planned responsibilities:
//   - A detected anomaly saved for an authenticated user (guest anomalies are never stored).
//   - Owner reference to User and a reference to the originating MonitoringRecord;
//     queries are always scoped by owner.
//   - The human-readable explanation produced by the AI alert-generation module.
//   - An active/inactive state used by active-alert retrieval.
export {};
