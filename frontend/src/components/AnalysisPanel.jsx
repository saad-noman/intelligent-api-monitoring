import AnomalyTags from './AnomalyTags.jsx';
import FormattedText from './FormattedText.jsx';
import StatusMessage from './StatusMessage.jsx';
import { isAnomalous, METRIC_FIELDS } from '../utils/monitoringData.js';
import { NOT_AVAILABLE } from '../utils/format.js';

function AnalysisEntry({ item }) {
  return (
    <article className="analysis-entry">
      <header className="analysis-entry-header">
        <h3>{item.apiName ?? NOT_AVAILABLE}</h3>
        <AnomalyTags anomalies={item.anomalies} />
      </header>

      {item.explanation ? (
        <FormattedText text={item.explanation} />
      ) : (
        <p className="muted">
          <em>An AI explanation is not available for this anomaly.</em>
        </p>
      )}

      <p className="analysis-facts">
        <span className="section-label">Observed data</span>
        {METRIC_FIELDS.map((field, index) => (
          <span key={field.key}>
            {index > 0 && ' · '}
            {field.label} <strong>{field.format(item[field.key])}</strong>
          </span>
        ))}
      </p>
    </article>
  );
}

// Left side of the monitoring page: AI-generated analysis of anomalous responses.
export default function AnalysisPanel({ items, isLoading }) {
  const anomalous = items?.filter(isAnomalous) ?? [];

  let content;
  if (isLoading) {
    content = <StatusMessage variant="loading" title="Generating analysis…" />;
  } else if (!items) {
    content = <p className="muted">Submit API response data to see the AI-generated analysis here.</p>;
  } else if (anomalous.length === 0) {
    content = <p className="muted">No anomalies were detected in the submitted responses, so no analysis was generated.</p>;
  } else {
    content = anomalous.map((item, index) => <AnalysisEntry key={`${item.apiName}-${index}`} item={item} />);
  }

  return (
    <aside className="analysis-panel">
      <div className="analysis-box">
        {/* <span className="eyebrow">AI analysis</span> */}
        <h2>
          Structured Insights
        </h2>
        {content}
        {anomalous.length > 0 && (
          <p className="analysis-note">
            <em>Possible causes are AI suggestions, not confirmed findings.</em>
          </p>
        )}
      </div>
    </aside>
  );
}
