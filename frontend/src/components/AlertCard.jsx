import MetricTile from './MetricTile.jsx';
import AnomalyTags from './AnomalyTags.jsx';
import { METRIC_FIELDS } from '../utils/monitoringData.js';
import { NOT_AVAILABLE } from '../utils/format.js';

// One anomaly: the AI-generated explanation, kept visually separate from the observed facts.
export default function AlertCard({ item }) {
  return (
    <article className="card alert-card">
      <header className="alert-card-header">
        <h3>{item.apiName ?? NOT_AVAILABLE}</h3>
        <AnomalyTags anomalies={item.anomalies} />
      </header>

      <section className="explanation">
        <span className="section-label">AI-generated explanation</span>
        {item.explanation ? (
          <p>{item.explanation}</p>
        ) : (
          <p className="muted">An AI explanation is not available for this anomaly.</p>
        )}
        <small className="muted">Possible causes are suggestions, not confirmed findings.</small>
      </section>

      <section>
        <span className="section-label">Observed data</span>
        <div className="metric-grid">
          {METRIC_FIELDS.map((field) => (
            <MetricTile key={field.key} label={field.label} value={field.format(item[field.key])} />
          ))}
        </div>
      </section>
    </article>
  );
}
