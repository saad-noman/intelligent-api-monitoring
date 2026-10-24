import { useEffect, useRef } from 'react';

// Icons per tone, matching the StatusMessage style.
const TONE_ICONS = {
  danger: '🗑️',
  warning: '⚠️',
  primary: '❔',
};

// Styled modal dialog with Cancel / Confirm buttons, built on the native <dialog>
// element (focus trapping, Escape to cancel). Rendered once by ConfirmProvider.
export default function ConfirmDialog({ options, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (options && !dialog.open) dialog.showModal();
    if (!options && dialog.open) dialog.close();
  }, [options]);

  const tone = options?.tone ?? 'primary';
  const confirmClass = tone === 'danger' ? 'btn-danger-solid' : 'btn-primary';

  return (
    // onCancel fires on Escape; it counts as "Cancel".
    <dialog
      ref={dialogRef}
      className={`confirm-dialog confirm-${tone}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose(false);
      }}
      aria-labelledby="confirm-title"
    >
      {options && (
        <div className="confirm-body">
          <span className="confirm-icon" aria-hidden="true">
            {TONE_ICONS[tone]}
          </span>
          <div className="confirm-text">
            <h2 id="confirm-title">{options.title}</h2>
            {options.message && <p>{options.message}</p>}
          </div>
          <div className="confirm-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onClose(false)}>
              {options.cancelLabel ?? 'Cancel'}
            </button>
            <button type="button" className={`btn btn-sm ${confirmClass}`} onClick={() => onClose(true)} autoFocus>
              {options.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
