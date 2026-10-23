// TODO: Define and export the Mongoose MonitoringRecord model.
// Planned responsibilities:
//   - A saved monitoring result for an authenticated user (guest results are never stored).
//   - Owner reference to User, set from the verified server-side identity; queries are
//     always scoped by owner.
//   - Input fields: api_name, response_time_ms, status_code, records_returned.
export {};
