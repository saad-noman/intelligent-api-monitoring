// Builds the minimal context given to the LLM: the API name, its observed metrics, and
// the rule findings with their evidence (threshold and how it was chosen, the learned
// baseline, the user-impact band, the HTTP status class). Response bodies and any other
// submitted data are deliberately excluded so no patient data can reach the provider.

// Evidence fields copied from a finding when present (undefined fields are left out).
const FINDING_FIELDS = ['type', 'rule', 'observed', 'threshold', 'threshold_source', 'baseline', 'user_impact', 'status_class'];

function toContextFinding(finding) {
  const entries = FINDING_FIELDS.filter((field) => finding[field] !== undefined && finding[field] !== null).map(
    (field) => [field, finding[field]],
  );
  return Object.fromEntries(entries);
}

export function buildAlertContext({ apiName, metrics, findings }) {
  return {
    api_name: apiName,
    metrics: metrics ?? {},
    anomalies: findings.map(toContextFinding),
  };
}
