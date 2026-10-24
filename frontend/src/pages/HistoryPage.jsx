import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import OutcomeNotice from '../components/OutcomeNotice.jsx';
import ActivityItem from '../components/ActivityItem.jsx';
import DeleteButton from '../components/DeleteButton.jsx';
import { clearActivities, deleteActivity, getActivities } from '../services/activityService.js';
import { toFriendlyMessage } from '../utils/errorMessages.js';

// History of actions performed on alerts (resolved, reopened, emailed). Deleting an
// alert also removes its history.
// Entries can be deleted one by one or all at once.
export default function HistoryPage() {
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [outcome, setOutcome] = useState(null); // { status, message }

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setActivities(await getActivities());
    } catch (err) {
      setError(toFriendlyMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item) {
    setDeletingId(item.id);
    setOutcome(null);
    try {
      await deleteActivity(item.id);
      setActivities((current) => current.filter((activity) => activity.id !== item.id));
      setOutcome({ status: 'done', message: 'The history entry was deleted.' });
    } catch (err) {
      setOutcome({ status: 'failed', message: toFriendlyMessage(err) });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClear() {
    setIsClearing(true);
    setOutcome(null);
    try {
      const deletedCount = await clearActivities();
      setActivities([]);
      setOutcome({ status: 'done', message: `${deletedCount} history entr${deletedCount === 1 ? 'y was' : 'ies were'} deleted.` });
    } catch (err) {
      setOutcome({ status: 'failed', message: toFriendlyMessage(err) });
    } finally {
      setIsClearing(false);
    }
  }

  const hasActivities = !isLoading && !error && activities.length > 0;

  return (
    <section className="stack">
      <PageHeader title="Alert" highlight="History">
        A record of the actions taken on your alerts: resolved, reopened, and emailed. Deleting an alert also removes its history.
      </PageHeader>

      <div className="button-row">
        <button type="button" className="btn btn-secondary btn-sm" onClick={load} disabled={isLoading}>
          {isLoading ? 'Refreshing…' : 'Refresh history'}
        </button>
        {hasActivities && (
          <DeleteButton
            label="Clear history"
            busyLabel="Clearing…"
            className="btn-wide"
            confirmTitle="Clear the whole history?"
            confirmText={`All ${activities.length} history entries will be deleted. Your alerts are not affected.`}
            onConfirm={handleClear}
            isBusy={isClearing}
          />
        )}
      </div>
      <OutcomeNotice title="History" outcome={outcome} />

      {isLoading && <StatusMessage variant="loading" title="Loading history…" />}
      {!isLoading && error && (
        <StatusMessage variant="error" title="Could not load history" onRetry={load}>
          {error}
        </StatusMessage>
      )}
      {!isLoading && !error && activities.length === 0 && (
        <StatusMessage title="No history yet">
          Resolving, reopening, or emailing an alert adds an entry here.
        </StatusMessage>
      )}
      {hasActivities && (
        <div className="activity-list">
          {activities.map((item) => (
            <ActivityItem key={item.id} item={item} onDelete={handleDelete} isDeleting={deletingId === item.id} />
          ))}
        </div>
      )}
    </section>
  );
}
