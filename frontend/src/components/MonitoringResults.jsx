import MetricTile from './MetricTile.jsx';
import ResponseTable from './ResponseTable.jsx';
import StatusMessage from './StatusMessage.jsx';
import { isAnomalous } from '../utils/monitoringData.js';

// Summary counts and every evaluated response. The AI analysis is shown by AnalysisPanel.
export default function MonitoringResults({ items }) {
  if (items.length === 0) {
    return <StatusMessage title="No results returned">The backend returned no monitoring results.</StatusMessage>;
  }

  const anomalous = items.filter(isAnomalous);

  return (
    <div className="stack">
      <div className="metric-grid">
        <MetricTile label="Responses evaluated" value={items.length} />
        <MetricTile label="Anomalies detected" value={anomalous.length} tone={anomalous.length ? 'alert' : undefined} />
        <MetricTile label="Without detected anomaly" value={items.length - anomalous.length} tone="ok" />
      </div>

      <h2>API responses</h2>
      <ResponseTable items={items} />
    </div>
  );
}
