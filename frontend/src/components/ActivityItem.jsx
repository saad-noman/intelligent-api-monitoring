import AlertId from './AlertId.jsx';
import AnomalyTags from './AnomalyTags.jsx';
import DeleteButton from './DeleteButton.jsx';
import ViewButton from './ViewButton.jsx';
import { ACTIVITY_LABELS } from '../utils/activityData.js';
import { formatDateTime, NOT_AVAILABLE } from '../utils/format.js';

// One history entry: what was done to which alert, when, and a snapshot of the alert.
// History only lists alerts that still exist, so View is always available.
export default function ActivityItem({ item, onDelete, isDeleting }) {
  return (
    <article className="card activity-item">
      <header className="activity-header">
        <span className={`activity-badge activity-${item.action}`}>{ACTIVITY_LABELS[item.action] ?? item.action}</span>
        <span className="muted">{formatDateTime(item.createdAt)}</span>
      </header>

      <div>
        <h3>{item.apiName ?? NOT_AVAILABLE}</h3>
        <AlertId value={item.alertId} fallback="No alert ID" />
      </div>

      {item.alertMessage && <p className="activity-message">{item.alertMessage}</p>}
      {item.anomalyTypes.length > 0 && <AnomalyTags anomalies={item.anomalyTypes} />}
      {item.severity && <span className={`severity severity-${item.severity}`}>Severity: {item.severity}</span>}
      {item.details && <small className="muted">{item.details}</small>}

      <div className="button-row">
        <ViewButton alertId={item.alertId} />
        <DeleteButton
          confirmTitle="Delete this history entry?"
          confirmText={`The "${ACTIVITY_LABELS[item.action] ?? item.action}" record for ${item.alertId} will be removed from your history. The alert itself is not affected.`}
          onConfirm={() => onDelete(item)}
          isBusy={isDeleting}
        />
      </div>
    </article>
  );
}
