import { useState } from 'react';
import FormField from './FormField.jsx';
import ResultMessage from './ResultMessage.jsx';
import { updateAccountEmail } from '../services/userService.js';
import { useAccountChange } from '../hooks/useAccountChange.js';

// Change the email used to log in (not the report email). Requires the current password.
// `onChanged` reloads the account after a successful change.
export default function AccountEmailForm({ account, onChanged }) {
  const [email, setEmail] = useState(account?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const { result, isBusy, run } = useAccountChange();

  async function handleSubmit(event) {
    event.preventDefault();
    const succeeded = await run(async () => {
      await updateAccountEmail(email.trim(), currentPassword);
      await onChanged();
    }, 'Your login email was changed. Use it the next time you log in.');
    if (succeeded) setCurrentPassword('');
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>Login email</h2>
      <FormField
        id="account-email"
        label="Email you log in with"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <FormField
        id="account-email-password"
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        hint="Required to confirm it's you."
        required
      />
      <ResultMessage result={result} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-sm btn-action" disabled={isBusy}>
          {isBusy ? 'Saving…' : 'Change email'}
        </button>
      </div>
    </form>
  );
}
