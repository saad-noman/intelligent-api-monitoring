import MetricTile from './MetricTile.jsx';
import DeleteButton from './DeleteButton.jsx';
import ViewButton from './ViewButton.jsx';
import AnomalyTags from './AnomalyTags.jsx';
import EvidenceList from './EvidenceList.jsx';
import AlertId from './AlertId.jsx';
import AiAnalysis from './AiAnalysis.jsx';
import AlertMessage from './AlertMessage.jsx';
import { METRIC_FIELDS } from '../utils/monitoringData.js';
import { formatAlertStatus, formatDateTime, NOT_AVAILABLE } from '../utils/format.js';

// One stored anomaly: the alert text, kept visually separate from the observed facts.
// Optional actions, available only for alerts with an ID: a View button (when
// `showViewLink`) and a Delete button (when `onDelete` is given).
export default function AlertCard({ item, showViewLink = true, onDelete, isDeleting = false }) {
  const hasAlertId = Boolean(item.alertId);
  const canView = showViewLink && hasAlertId;
  const canDelete = Boolean(onDelete) && hasAlertId;

  return (
    <article className="card alert-card">
      <header className="alert-card-header">
        <div>
          <h3>{item.apiName ?? NOT_AVAILABLE}</h3>
          <AlertId value={item.alertId} fallback="No alert ID" />
        </div>
        <AnomalyTags anomalies={item.anomalies} />
      </header>

      <section className="explanation">
        <AlertMessage item={item} retryHint="Use “Run AI analysis” on the alert page to try again." />
        <small className="muted">Possible causes are suggestions, not confirmed findings.</small>
      </section>

      <AiAnalysis analysis={item.analysis} model={item.aiModel} />

      <section>
        <span className="section-label">Detection evidence</span>
        <EvidenceList findings={item.findings} />
      </section>

      <section>
        <span className="section-label">Observed data</span>
        <div className="metric-grid">
          {METRIC_FIELDS.map((field) => (
            <MetricTile key={field.key} label={field.label} value={field.format(item[field.key])} />
          ))}
        </div>
      </section>

      <footer className="alert-card-footer">
        <div className="alert-card-meta muted">
          <span>Detected: {formatDateTime(item.detectedAt)}</span>
          <span>Status: {formatAlertStatus(item.active)}</span>
        </div>
        {(canView || canDelete) && (
          <div className="button-row">
            {canView && <ViewButton alertId={item.alertId} />}
            {canDelete && (
              <DeleteButton
                onConfirm={() => onDelete(item)}
                confirmTitle="Delete this alert?"
                confirmText={`Alert ${item.alertId} (${item.apiName}) will be permanently deleted. This cannot be undone.`}
                isBusy={isDeleting}
              />
            )}
          </div>
        )}
      </footer>
    </article>
  );
}
