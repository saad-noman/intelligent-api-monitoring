import AlertCard from './AlertCard.jsx';

// Reusable list of anomaly alerts with their human-readable explanations.
export default function AlertList({ alerts }) {
  return (
    <div className="alert-list">
      {alerts.map((alert, index) => (
        <AlertCard key={`${alert.apiName}-${index}`} item={alert} />
      ))}
    </div>
  );
}
