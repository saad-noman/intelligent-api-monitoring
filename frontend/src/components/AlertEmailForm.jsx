import { useState } from 'react';
import FormField from './FormField.jsx';
import StatusMessage from './StatusMessage.jsx';
import DeleteButton from './DeleteButton.jsx';
import { removeAlertEmail, updateAlertEmail } from '../services/userService.js';
import { NOT_AVAILABLE } from '../utils/format.js';
import { toFriendlyMessage } from '../utils/errorMessages.js';
import { useAutoHide } from '../hooks/useAutoHide.js';

// Save, update, or remove the report email address (separate from the login email).
// `onChanged` reloads the account after a successful change.
export default function AlertEmailForm({ account, onChanged }) {
  const [alertEmail, setAlertEmail] = useState(account?.alertEmail ?? '');
  const [result, setResult] = useState(null); // { ok: boolean, message: string }
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const hasSavedEmail = Boolean(account?.alertEmail);
  const isResultHidden = useAutoHide(result?.ok ? result : null);

  // Runs one change, reloads the account, and shows a success or error message.
  async function runChange(setBusy, change, successMessage) {
    setBusy(true);
    setResult(null);
    try {
      await change();
      await onChanged();
      setResult({ ok: true, message: successMessage });
    } catch (err) {
      setResult({ ok: false, message: toFriendlyMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    runChange(setIsSaving, () => updateAlertEmail(alertEmail.trim()), 'Your report email address was saved.');
  }

  function handleRemove() {
    runChange(
      setIsRemoving,
      async () => {
        await removeAlertEmail();
        setAlertEmail('');
      },
      'Your report email address was removed.',
    );
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>Report email</h2>
      <dl className="details">
        <dt>Account email</dt>
        <dd>{account?.email ?? NOT_AVAILABLE}</dd>
        <dt>Current report email</dt>
        <dd>{account?.alertEmail ?? 'No report email saved yet'}</dd>
      </dl>

      <FormField
        id="alert-email"
        label="Report email address"
        type="email"
        value={alertEmail}
        onChange={(event) => setAlertEmail(event.target.value)}
        hint="This can differ from the email you log in with."
        required
      />

      {result && !isResultHidden && <StatusMessage variant={result.ok ? 'success' : 'error'}>{result.message}</StatusMessage>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-sm btn-action" disabled={isSaving || isRemoving}>
          {isSaving ? 'Saving…' : hasSavedEmail ? 'Update email' : 'Save email'}
        </button>
        {hasSavedEmail && (
          <DeleteButton
            label="Remove email"
            busyLabel="Removing…"
            confirmTitle="Remove report email?"
            confirmText="Anomaly reports will not be emailed until you save a new address."
            onConfirm={handleRemove}
            isBusy={isRemoving}
          />
        )}
      </div>
    </form>
  );
}
