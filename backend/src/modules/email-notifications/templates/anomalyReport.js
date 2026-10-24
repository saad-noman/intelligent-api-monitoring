// Plain-text anomaly report built only from stored/detected alert data.
// Each alert: { alert_id, api_name, anomalies: [{ type, rule, observed }], explanation, detected_at }.

function formatEvidence(finding) {
  return `${finding.type}: rule "${finding.rule}", observed ${JSON.stringify(finding.observed)}`;
}

// AI analysis lines, when the alert has one.
function formatAnalysis(analysis) {
  if (!analysis) return [];
  return [
    `   Severity: ${analysis.severity}`,
    `   Possible impact: ${analysis.impact}`,
    ...analysis.possible_causes.map((cause) => `   Possible cause: ${cause}`),
    ...analysis.recommended_checks.map((check) => `   Recommended check: ${check}`),
  ];
}

function formatAlert(alert, position) {
  const lines = [
    `${position + 1}. ${alert.api_name} [${alert.alert_id}]`,
    `   Alert: ${alert.explanation}`,
    ...formatAnalysis(alert.analysis),
    ...alert.anomalies.map((finding) => `   - ${formatEvidence(finding)}`),
    `   Detected: ${new Date(alert.detected_at).toISOString()}`,
  ];
  return lines.join('\n');
}

export function buildAnomalyReport(alerts) {
  return {
    subject: `API anomaly report: ${alerts.length} alert(s)`,
    text: [
      `The API monitor detected ${alerts.length} anomaly alert(s).`,
      '',
      ...alerts.map(formatAlert),
      '',
      'Possible causes in alert text are suggestions, not confirmed findings.',
    ].join('\n'),
  };
}
