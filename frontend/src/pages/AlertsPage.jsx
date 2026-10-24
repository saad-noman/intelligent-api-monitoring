import { useCallback, useEffect, useState } from 'react';
import AlertList from '../components/AlertList.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { getActiveAlerts } from '../services/alertsService.js';

// Display of the authenticated user's active anomalies from GET /alerts.
export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setAlerts(await getActiveAlerts());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="stack">
      <PageHeader title="Detected" highlight="Anomalies">
        AI-generated explanations of active anomalies, shown alongside the observed API data.
      </PageHeader>

      {isLoading && <StatusMessage variant="loading" title="Loading active alerts…" />}
      {!isLoading && error && (
        <StatusMessage variant="error" title="Could not load alerts" onRetry={load}>
          {error}
        </StatusMessage>
      )}
      {!isLoading && !error && alerts.length === 0 && (
        <StatusMessage title="No active anomalies found">No active anomalies were returned for your account.</StatusMessage>
      )}
      {!isLoading && !error && alerts.length > 0 && <AlertList alerts={alerts} />}
    </section>
  );
}
