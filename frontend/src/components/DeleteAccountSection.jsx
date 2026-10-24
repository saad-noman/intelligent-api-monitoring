import { useState } from 'react';
import { useNavigate } from 'react-router';
import FormField from './FormField.jsx';
import ResultMessage from './ResultMessage.jsx';
import DeleteButton from './DeleteButton.jsx';
import { deleteAccount } from '../services/userService.js';
import { useAccountChange } from '../hooks/useAccountChange.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PATHS } from '../routes/paths.js';

// Permanently deletes the account and all of its data, after the password is entered
// and the deletion is confirmed in a dialog. The user is then signed out.
export default function DeleteAccountSection() {
  const [password, setPassword] = useState('');
  const { result, isBusy, run } = useAccountChange();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleDelete() {
    const succeeded = await run(() => deleteAccount(password), 'Your account was deleted.');
    if (!succeeded) return;
    await signOut();
    navigate(PATHS.monitor, { replace: true });
  }

  return (
    <section className="card form-card">
      <h2>Delete account</h2>
      <p className="muted">
        This permanently deletes your account, saved alerts, history, and monitoring records. It cannot be undone.
      </p>
      <FormField
        id="delete-account-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        hint="Enter your password to confirm."
      />
      <ResultMessage result={result} />
      <div className="form-actions">
        <DeleteButton
          label="Delete account"
          busyLabel="Deleting…"
          confirmTitle="Delete your account?"
          confirmText="Your account and all of its data will be permanently deleted."
          onConfirm={handleDelete}
          isBusy={isBusy || password === ''}
        />
      </div>
    </section>
  );
}
