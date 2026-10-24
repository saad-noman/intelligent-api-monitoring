// Last-resort alert text, used only when no AI model returned a valid analysis
// (no API key, provider outage, rate limits on every model). It restates the detected
// rules and observed values from the data itself and suggests no cause or impact.
// Example: "AppointmentAPI: FAILED_REQUEST (rule status_code >= 400; observed status_code: 500).
//           AI analysis is currently unavailable, so no cause or impact is suggested."

// { status_code: 500 } -> "status_code: 500"; { missing_fields: ["a", "b"] } -> "missing_fields: a, b"
function describeObserved(observed) {
  return Object.entries(observed)
    .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value ?? 'missing'}`)
    .join(', ');
}

function describeFinding(finding) {
  return `${finding.type} (rule ${finding.rule}; observed ${describeObserved(finding.observed)})`;
}

export function buildFallbackAlert({ apiName, findings }) {
  const detected = findings.map(describeFinding).join('; ');
  return `${apiName}: ${detected}. AI analysis is currently unavailable, so no cause or impact is suggested.`;
}
