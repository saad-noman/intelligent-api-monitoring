// Shared loading / empty / error / success feedback block.
export default function StatusMessage({ variant = 'info', title, children, onRetry }) {
  const isError = variant === 'error';
  return (
    <div className={`status status-${variant}`} role={isError ? 'alert' : 'status'}>
      {variant === 'loading' && <span className="spinner" aria-hidden="true" />}
      <div>
        {title && <strong>{title}</strong>}
        {children && <p>{children}</p>}
        {onRetry && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
