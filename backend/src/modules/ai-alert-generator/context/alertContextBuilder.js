// Builds the minimal context given to the LLM: the API name, its observed metrics, and
// the rule findings (type, rule, observed values, threshold). Response bodies and any
// other submitted data are deliberately excluded so no patient data can reach the provider.
export function buildAlertContext({ apiName, metrics, findings }) {
  return {
    api_name: apiName,
    metrics: metrics ?? {},
    anomalies: findings.map(({ type, rule, observed, threshold }) => ({ type, rule, observed, threshold })),
  };
}
