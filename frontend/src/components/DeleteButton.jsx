import TrashIcon from './TrashIcon.jsx';
import { useConfirm } from '../context/ConfirmContext.jsx';

// Red trash button that asks for confirmation (styled dialog) before calling `onConfirm`.
// Same structure and size as ViewButton.
// `label` is the visible text, `busyLabel` is shown while working, `confirmTitle` and
// `confirmText` are shown in the dialog. `className` adds extra classes (e.g. btn-wide).
export default function DeleteButton({
  onConfirm,
  confirmText,
  confirmTitle,
  label = 'Delete',
  busyLabel = 'Deleting…',
  isBusy = false,
  className = '',
}) {
  const confirm = useConfirm();

  async function handleClick() {
    const confirmed = await confirm({
      title: confirmTitle ?? `${label}?`,
      message: confirmText,
      confirmLabel: label,
      tone: 'danger',
    });
    if (confirmed) onConfirm();
  }

  return (
    <button type="button" className={`btn btn-danger btn-sm btn-action ${className}`} onClick={handleClick} disabled={isBusy}>
      <TrashIcon />
      {isBusy ? busyLabel : label}
    </button>
  );
}
