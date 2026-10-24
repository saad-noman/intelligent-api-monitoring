// Shows the anomaly labels exactly as the backend reported them.
export default function AnomalyTags({ anomalies }) {
  if (anomalies.length === 0) return <span className="tag tag-ok">No anomaly detected</span>;
  return (
    <ul className="tags">
      {anomalies.map((anomaly) => (
        <li key={anomaly} className="tag tag-alert">
          {anomaly}
        </li>
      ))}
    </ul>
  );
}
