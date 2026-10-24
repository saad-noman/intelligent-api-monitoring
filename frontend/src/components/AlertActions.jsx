import { Link } from 'react-router';
import DeleteButton from './DeleteButton.jsx';
import { PATHS } from '../routes/paths.js';
import { ANALYSIS_STATUS } from '../utils/monitoringData.js';

// Names of the actions that can be in progress on the alert detail page.
export const ALERT_ACTIONS = {
  status: 'status',
  analyze: 'analyze',
  email: 'email',
  copy: 'copy',
  delete: 'delete',
};

// Action panel for one saved alert. Only one action runs at a time (`busyAction`).
export default function AlertActions({ alert, busyAction, onToggleStatus, onAnalyze, onEmail, onCopyId, onDelete }) {
  const isBusy = busyAction !== null;
  const analyzeLabel = alert.analysisStatus === ANALYSIS_STATUS.completed ? 'Re-run AI analysis' : 'Run AI analysis';

  return (
    <aside className="card alert-actions">
      <h2>Actions</h2>

      <button type="button" className="btn btn-primary btn-sm" onClick={onToggleStatus} disabled={isBusy}>
        {busyAction === ALERT_ACTIONS.status ? 'Updating…' : alert.active ? 'Mark as resolved' : 'Reopen alert'}
      </button>

      <button type="button" className="btn btn-secondary btn-sm" onClick={onAnalyze} disabled={isBusy}>
        {busyAction === ALERT_ACTIONS.analyze ? 'Analysing…' : analyzeLabel}
      </button>

      <button type="button" className="btn btn-secondary btn-sm" onClick={onEmail} disabled={isBusy}>
        {busyAction === ALERT_ACTIONS.email ? 'Sending…' : 'Email this alert'}
      </button>

      <button type="button" className="btn btn-secondary btn-sm" onClick={onCopyId} disabled={isBusy}>
        Copy alert ID
      </button>

      <DeleteButton
        onConfirm={onDelete}
        confirmTitle="Delete this alert?"
        confirmText={`Alert ${alert.alertId} (${alert.apiName}) will be permanently deleted. This cannot be undone.`}
        isBusy={busyAction === ALERT_ACTIONS.delete}
      />

      <Link to={PATHS.alerts} className="btn btn-secondary btn-sm">
        ← Back to alerts
      </Link>
    </aside>
  );
}
