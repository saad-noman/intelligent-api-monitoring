// The AI analysis of one anomaly: severity, possible impact, possible causes,
// recommended checks, and the web references it relied on, exactly as returned by the
// backend. Renders nothing when the alert has no AI analysis (e.g. the AI service was unavailable).
function ReferenceList({ summary, references }) {
  if (!summary && !references?.length) return null;
  return (
    <div>
      <span className="section-label">Research</span>
      {summary && <p className="analysis-text">{summary}</p>}
      {references?.length > 0 && (
        <ul className="analysis-list">
          {references.map((reference) => (
            <li key={reference.url}>
              <a href={reference.url} target="_blank" rel="noopener noreferrer">
                {reference.title}
              </a>{' '}
              <small className="muted">({reference.site})</small> — {reference.relevance}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
      <ReferenceList summary={analysis.research_summary} references={analysis.references} />
    </section>
  );
}
