import { useState } from 'react';
import FormField from './FormField.jsx';
import ResultMessage from './ResultMessage.jsx';
import { updateName } from '../services/userService.js';
import { useAccountChange } from '../hooks/useAccountChange.js';

// Change the first and last name. `onChanged` reloads the account after a successful change.
export default function ProfileNameForm({ account, onChanged }) {
  const [firstName, setFirstName] = useState(account?.firstName ?? '');
  const [lastName, setLastName] = useState(account?.lastName ?? '');
  const { result, isBusy, run } = useAccountChange();

  function handleSubmit(event) {
    event.preventDefault();
    run(async () => {
      await updateName(firstName.trim(), lastName.trim());
      await onChanged();
    }, 'Your name was saved.');
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>Name</h2>
      <FormField
        id="settings-first-name"
        label="First name"
        autoComplete="given-name"
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        required
      />
      <FormField
        id="settings-last-name"
        label="Last name"
        autoComplete="family-name"
        value={lastName}
        onChange={(event) => setLastName(event.target.value)}
        required
      />
      <ResultMessage result={result} />
      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-sm btn-action" disabled={isBusy}>
          {isBusy ? 'Saving…' : 'Save name'}
        </button>
      </div>
    </form>
  );
}
