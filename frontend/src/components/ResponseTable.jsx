import AnomalyTags from './AnomalyTags.jsx';
import AlertId from './AlertId.jsx';
import { isAnomalous, RESPONSE_FIELDS } from '../utils/monitoringData.js';

const ALERT_ID_LABEL = 'Alert ID';
const ANOMALIES_LABEL = 'Anomalies';

// API response facts per row; rows the backend flagged as anomalous are highlighted.
// When the table is narrow, each row collapses into a stacked card (see `data-label` in CSS).
export default function ResponseTable({ items }) {
  return (
    <div className="card table-card">
      <table className="response-table">
        <thead>
          <tr>
            <th>{ALERT_ID_LABEL}</th>
            {RESPONSE_FIELDS.map((field) => (
              <th key={field.key}>{field.label}</th>
            ))}
            <th>{ANOMALIES_LABEL}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.alertId ?? index} className={isAnomalous(item) ? 'row-anomalous' : undefined}>
              <td data-label={ALERT_ID_LABEL}>
                <AlertId value={item.alertId} />
              </td>
              {RESPONSE_FIELDS.map((field) => (
                <td key={field.key} data-label={field.label}>
                  {field.key === 'apiName' ? <strong>{field.format(item.apiName)}</strong> : field.format(item[field.key])}
                </td>
              ))}
              <td data-label={ANOMALIES_LABEL}>
                <AnomalyTags anomalies={item.anomalies} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
