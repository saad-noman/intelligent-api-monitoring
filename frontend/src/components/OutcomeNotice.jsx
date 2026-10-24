import StatusMessage from './StatusMessage.jsx';
import { useAutoHide } from '../hooks/useAutoHide.js';

// Outcome statuses (storage: saved/skipped/failed, email: sent/skipped/failed,
// alert actions: done/failed).
const VARIANTS = {
  saved: 'success',
  sent: 'success',
  done: 'success',
  skipped: 'info',
  failed: 'error',
};

// Shows a backend { status, message } outcome as-is, without inventing results.
// Success outcomes disappear automatically after a few seconds; others stay.
export default function OutcomeNotice({ title, outcome, children }) {
  const variant = VARIANTS[outcome?.status] ?? 'info';
  const isHidden = useAutoHide(variant === 'success' ? outcome : null);

  if (!outcome || isHidden) return null;
  return (
    <StatusMessage variant={variant} title={title}>
      {outcome.message} {children}
    </StatusMessage>
  );
}
