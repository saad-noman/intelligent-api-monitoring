import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import AlertCard from '../components/AlertCard.jsx';
import AlertActions, { ALERT_ACTIONS } from '../components/AlertActions.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import OutcomeNotice from '../components/OutcomeNotice.jsx';
import {
  deleteAlert,
  emailSingleAlert,
  getAlertById,
  reanalyzeAlert,
  updateAlertStatus,
} from '../services/alertsService.js';
import { toFriendlyMessage } from '../utils/errorMessages.js';
import { ALERT_OUTCOMES } from '../utils/alertOutcomes.js';
import { PATHS } from '../routes/paths.js';
import { useConfirm } from '../context/ConfirmContext.jsx';

// Dialog shown before resolving or reopening an alert.
function statusChangeDialog(alert) {
  if (alert.active) {
    return {
      title: 'Mark this alert as resolved?',
      message: `${alert.alertId} will leave the active alerts list. It stays in History and can be reopened.`,
      confirmLabel: 'Mark as resolved',
      tone: 'primary',
    };
  }
  return {
    title: 'Reopen this alert?',
    message: `${alert.alertId} will appear in the active alerts list again.`,
    confirmLabel: 'Reopen alert',
    tone: 'primary',
  };
}

// Detail view of one saved alert (GET /alerts/:alertId) with its actions:
// resolve/reopen, email, copy ID, and delete.
export default function AlertDetailPage() {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [alert, setAlert] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState(null);
  const [outcome, setOutcome] = useState(null); // { status, message }

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setAlert(await getAlertById(alertId));
    } catch (err) {
      setAlert(null);
      setLoadError(toFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    load();
  }, [load]);

  // Runs one action at a time and shows the { status, message } it returns.
  async function runAction(name, action) {
    setBusyAction(name);
    setOutcome(null);
    try {
      setOutcome(await action());
    } catch (err) {
      setOutcome(ALERT_OUTCOMES.failed(toFriendlyMessage(err)));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleStatus() {
    const confirmed = await confirm(statusChangeDialog(alert));
    if (!confirmed) return;
    runAction(ALERT_ACTIONS.status, async () => {
      const updated = await updateAlertStatus(alert.alertId, !alert.active);
      setAlert(updated);
      return ALERT_OUTCOMES.statusChanged(updated.active);
    });
  }

  function handleAnalyze() {
    runAction(ALERT_ACTIONS.analyze, async () => {
      const updated = await reanalyzeAlert(alert.alertId);
      setAlert(updated);
      return ALERT_OUTCOMES.analyzed(updated);
    });
  }

  function handleEmail() {
    runAction(ALERT_ACTIONS.email, () => emailSingleAlert(alert.alertId));
  }

  function handleCopyId() {
    runAction(ALERT_ACTIONS.copy, async () => {
      try {
        await navigator.clipboard.writeText(alert.alertId);
        return ALERT_OUTCOMES.copied(alert.alertId);
      } catch {
        return ALERT_OUTCOMES.copyFailed();
      }
    });
  }

  // On success the alert no longer exists, so go back to the list and report it there.
  async function handleDelete() {
    setBusyAction(ALERT_ACTIONS.delete);
    setOutcome(null);
    try {
      await deleteAlert(alert.alertId);
      navigate(PATHS.alerts, { state: { deleteOutcome: ALERT_OUTCOMES.deleted(alert.alertId) } });
    } catch (err) {
      setOutcome(ALERT_OUTCOMES.failed(toFriendlyMessage(err)));
      setBusyAction(null);
    }
  }

  return (
    <section className="stack">
      <PageHeader title="Alert" highlight="Details">
        One saved alert with its message, detection evidence, and observed data.
      </PageHeader>

      {isLoading && <StatusMessage variant="loading" title="Loading alert…" />}
      {!isLoading && loadError && (
        <StatusMessage variant="error" title="Could not load this alert" onRetry={load}>
          {loadError} <Link to={PATHS.alerts}>Back to alerts</Link>
        </StatusMessage>
      )}
      {!isLoading && alert && (
        <>
          <OutcomeNotice title="Action result" outcome={outcome} />
          <div className="detail-layout">
            <AlertCard item={alert} showViewLink={false} />
            <AlertActions
              alert={alert}
              busyAction={busyAction}
              onToggleStatus={handleToggleStatus}
              onAnalyze={handleAnalyze}
              onEmail={handleEmail}
              onCopyId={handleCopyId}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}
    </section>
  );
}
