// Plain-text anomaly report built only from stored/detected alert data.
// Each alert: { alert_id, api_name, anomalies: [{ type, rule, observed }], explanation,
// analysis_error, analysis, detected_at }.

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
    ...(analysis.research_summary ? [`   Research: ${analysis.research_summary}`] : []),
    ...(analysis.references ?? []).map((reference) => `   Reference: ${reference.title} (${reference.url})`),
  ];
}

// The AI alert text, or the reason the AI analysis did not complete.
function formatAlertText(alert) {
  if (alert.explanation) return `   Alert: ${alert.explanation}`;
  return `   AI analysis not completed (${alert.analysis_error}). It can be run again from the alert page.`;
}

function formatAlert(alert, position) {
  const lines = [
    `${position + 1}. ${alert.api_name} [${alert.alert_id}]`,
    formatAlertText(alert),
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
