import ViewButton from './ViewButton.jsx';
import AnomalyTags from './AnomalyTags.jsx';
import StatusMessage from './StatusMessage.jsx';
import EvidenceList from './EvidenceList.jsx';
import AlertId from './AlertId.jsx';
import AiAnalysis from './AiAnalysis.jsx';
import AlertMessage from './AlertMessage.jsx';
import { isAnomalous, METRIC_FIELDS } from '../utils/monitoringData.js';
import { NOT_AVAILABLE } from '../utils/format.js';

// `canView`: the alert was saved, so its detail page exists.
function AnalysisEntry({ item, canView }) {
  return (
    <article className="analysis-entry">
      <header className="analysis-entry-header">
        <div>
          <h3>{item.apiName ?? NOT_AVAILABLE}</h3>
          <AlertId value={item.alertId} fallback="No alert ID" />
        </div>
        <AnomalyTags anomalies={item.anomalies} />
      </header>

      <AlertMessage
        item={item}
        retryHint={canView ? 'Open the alert and use “Run AI analysis” to try again.' : 'Submit the data again to retry.'}
      />

      <AiAnalysis analysis={item.analysis} model={item.aiModel} />

      <EvidenceList findings={item.findings} />

      {canView && item.alertId && (
        <div className="analysis-view-link">
          <ViewButton alertId={item.alertId} />
        </div>
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
// `canView` is true only when the results were saved (guest results have no detail page).
export default function AnalysisPanel({ items, isLoading, canView = false }) {
  const anomalous = items?.filter(isAnomalous) ?? [];

  let content;
  if (isLoading) {
    content = <StatusMessage variant="loading" title="Generating analysis…" />;
  } else if (!items) {
    content = <p className="muted">Submit API response data to see the generated alerts here.</p>;
  } else if (anomalous.length === 0) {
    content = <p className="muted">No anomalies were detected in the submitted responses, so no alert was generated.</p>;
  } else {
    content = anomalous.map((item, index) => <AnalysisEntry key={item.alertId ?? index} item={item} canView={canView} />);
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
            <em>Possible causes are suggestions, not confirmed findings.</em>
          </p>
        )}
      </div>
    </aside>
  );
}
