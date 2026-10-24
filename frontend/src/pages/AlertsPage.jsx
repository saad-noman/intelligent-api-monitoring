import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import AlertList from '../components/AlertList.jsx';
import AlertSearch from '../components/AlertSearch.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import OutcomeNotice from '../components/OutcomeNotice.jsx';
import { deleteAlert, emailAlertReport, getActiveAlerts, getAlertById } from '../services/alertsService.js';
import { isNoDataError, toFriendlyMessage } from '../utils/errorMessages.js';
import { ALERT_OUTCOMES } from '../utils/alertOutcomes.js';
import { useConfirm } from '../context/ConfirmContext.jsx';

// Display of the authenticated user's active anomalies from GET /alerts, with a search by
// alert ID, a manual refresh, and an email report of the active alerts.
export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailOutcome, setEmailOutcome] = useState(null); // { status, message }
  const [isEmailing, setIsEmailing] = useState(false);
  const [search, setSearch] = useState(null); // { item } on success, { error } on failure
  const [isSearching, setIsSearching] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  // A deletion made here, or on the detail page (passed via navigation state).
  const location = useLocation();
  const confirm = useConfirm();
  const [deleteOutcome, setDeleteOutcome] = useState(location.state?.deleteOutcome ?? null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAlerts(await getActiveAlerts());
    } catch (err) {
      // A missing or not-yet-available alert source just means there is nothing to show.
      if (isNoDataError(err)) setAlerts([]);
      else setError(toFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSearch(alertId) {
    setIsSearching(true);
    try {
      setSearch({ item: await getAlertById(alertId) });
    } catch (err) {
      setSearch({ error: toFriendlyMessage(err) });
    } finally {
      setIsSearching(false);
    }
  }

  // Deletes one alert, then removes it from the list and from the search result.
  async function handleDelete(item) {
    setDeletingId(item.alertId);
    setDeleteOutcome(null);
    try {
      await deleteAlert(item.alertId);
      setAlerts((current) => current.filter((alert) => alert.alertId !== item.alertId));
      setSearch((current) => (current?.item?.alertId === item.alertId ? null : current));
      setDeleteOutcome(ALERT_OUTCOMES.deleted(item.alertId));
    } catch (err) {
      setDeleteOutcome(ALERT_OUTCOMES.failed(toFriendlyMessage(err)));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEmailReport() {
    const confirmed = await confirm({
      title: 'Email the active alerts?',
      message: `A report with ${alerts.length} active alert(s) will be sent to your saved report email.`,
      confirmLabel: 'Send report',
      tone: 'primary',
    });
    if (!confirmed) return;
    setIsEmailing(true);
    setEmailOutcome(null);
    try {
      setEmailOutcome(await emailAlertReport());
    } catch (err) {
      setEmailOutcome({ status: 'failed', message: toFriendlyMessage(err) });
    } finally {
      setIsEmailing(false);
    }
  }

  const hasAlerts = !isLoading && !error && alerts.length > 0;

  return (
    <section className="stack">
      <PageHeader title="Detected" highlight="Anomalies">
        Active anomalies stored for your account, with their alert message and the rule evidence that triggered them.
      </PageHeader>

      <AlertSearch
        onSearch={handleSearch}
        onClear={() => setSearch(null)}
        isSearching={isSearching}
        hasResult={search !== null}
      />
      {search?.error && (
        <StatusMessage variant="error" title="Alert not found">
          {search.error}
        </StatusMessage>
      )}
      {search?.item && (
        <>
          <h2>Search result</h2>
          <AlertList alerts={[search.item]} onDelete={handleDelete} deletingId={deletingId} />
        </>
      )}

      <div className="button-row">
        <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={isLoading}>
          {isLoading ? 'Refreshing…' : 'Refresh alerts'}
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={handleEmailReport} disabled={!hasAlerts || isEmailing}>
          {isEmailing ? 'Sending…' : 'Email report'}
        </button>
      </div>
      <OutcomeNotice title="Email report" outcome={emailOutcome} />
      <OutcomeNotice title="Delete alert" outcome={deleteOutcome} />

      {isLoading && <StatusMessage variant="loading" title="Loading active alerts…" />}
      {!isLoading && error && (
        <StatusMessage variant="error" title="Could not load alerts" onRetry={load}>
          {error}
        </StatusMessage>
      )}
      {!isLoading && !error && alerts.length === 0 && (
        <StatusMessage title="No data yet">No active anomalies found for your account.</StatusMessage>
      )}
      {hasAlerts && <AlertList alerts={alerts} onDelete={handleDelete} deletingId={deletingId} />}
    </section>
  );
}
