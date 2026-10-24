import AlertCard from './AlertCard.jsx';

// Reusable list of anomaly alerts with their human-readable explanations.
// `onDelete` (optional) adds a delete button; `deletingId` marks the alert being deleted.
export default function AlertList({ alerts, onDelete, deletingId = null }) {
  return (
    <div className="alert-list">
      {alerts.map((alert, index) => (
        <AlertCard
          key={alert.alertId ?? alert.id ?? `${alert.apiName}-${index}`}
          item={alert}
          onDelete={onDelete}
          isDeleting={deletingId !== null && deletingId === alert.alertId}
        />
      ))}
    </div>
  );
}
