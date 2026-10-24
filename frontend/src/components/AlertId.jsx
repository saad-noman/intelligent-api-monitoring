// Shows an issue's unique alert ID, or a fallback text when the item has none.
export default function AlertId({ value, fallback = 'No alert' }) {
  if (!value) return <span className="muted">{fallback}</span>;
  return (
    <code className="alert-id" title="Unique alert ID">
      {value}
    </code>
  );
}
