import { useState } from 'react';
import FormField from './FormField.jsx';
import ResultMessage from './ResultMessage.jsx';
import { changePassword } from '../services/userService.js';
import { useAccountChange } from '../hooks/useAccountChange.js';

const EMPTY_FIELDS = { currentPassword: '', newPassword: '', confirmPassword: '' };

// Change the password. The new password is typed twice to avoid typos.
export default function PasswordForm() {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const { result, isBusy, run, showError } = useAccountChange();

  function updateField(name) {
    return (event) => setFields((current) => ({ ...current, [name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (fields.newPassword !== fields.confirmPassword) {
      showError('The new passwords do not match.');
      return;
    }
    const succeeded = await run(
      () => changePassword(fields.currentPassword, fields.newPassword),
      'Your password was changed.',
    );
    if (succeeded) setFields(EMPTY_FIELDS);
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>Password</h2>
      <FormField
        id="current-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={fields.currentPassword}
        onChange={updateField('currentPassword')}
        required
      />
      <FormField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        value={fields.newPassword}
        onChange={updateField('newPassword')}
        required
      />
      <FormField
        id="confirm-password"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={fields.confirmPassword}
        onChange={updateField('confirmPassword')}
        required
      />
      <ResultMessage result={result} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-sm btn-action" disabled={isBusy}>
          {isBusy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}
