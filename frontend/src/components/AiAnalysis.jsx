// The AI analysis of one anomaly: severity, possible impact, possible causes, and
// recommended checks, exactly as returned by the backend. Renders nothing when the
// alert has no AI analysis (e.g. the AI service was unavailable).
function AnalysisList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <span className="section-label">{title}</span>
      <ul className="analysis-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AiAnalysis({ analysis, model }) {
  if (!analysis) return null;

  return (
    <section className="ai-analysis">
      <div className="ai-analysis-header">
        <span className={`severity severity-${analysis.severity}`}>Severity: {analysis.severity}</span>
        {model && <small className="muted">Model: {model}</small>}
      </div>

      {analysis.impact && (
        <div>
          <span className="section-label">Possible impact</span>
          <p className="analysis-text">{analysis.impact}</p>
        </div>
      )}

      <AnalysisList title="Possible causes" items={analysis.possible_causes} />
      <AnalysisList title="Recommended checks" items={analysis.recommended_checks} />
    </section>
  );
}
