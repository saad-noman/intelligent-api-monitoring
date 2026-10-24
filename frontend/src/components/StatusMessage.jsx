// Icons shown before the text for variants that need extra emphasis.
const VARIANT_ICONS = {
  warning: '⚠️',
};

// Shared loading / empty / error / success / warning feedback block.
// `onRetry` adds a retry button; `onDismiss` adds a close button.
export default function StatusMessage({ variant = 'info', title, children, onRetry, onDismiss }) {
  const isUrgent = variant === 'error' || variant === 'warning';
  const icon = VARIANT_ICONS[variant];

  return (
    <div className={`status status-${variant}`} role={isUrgent ? 'alert' : 'status'}>
      {variant === 'loading' && <span className="spinner" aria-hidden="true" />}
      {icon && (
        <span className="status-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="status-body">
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
        {onRetry && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" className="status-dismiss" onClick={onDismiss} aria-label="Dismiss message">
          ×
        </button>
      )}
    </div>
  );
}
