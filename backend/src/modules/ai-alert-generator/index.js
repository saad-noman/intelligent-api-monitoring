// Public interface of the AI alert-generation module. Its sole purpose is producing
// accurate, human-readable explanations of detected API anomalies; it is not a
// general-purpose research agent.
//
// Callers (services, never controllers) pass all needed context explicitly. The module
// does not access the database or HTTP request objects.
export { generateAlertExplanation } from './agent/alertAgent.js';
