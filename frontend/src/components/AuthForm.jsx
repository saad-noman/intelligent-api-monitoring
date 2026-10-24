import { useState } from 'react';
import FormField from './FormField.jsx';
import StatusMessage from './StatusMessage.jsx';
import { toFriendlyMessage } from '../utils/errorMessages.js';

// Shared email + password form used by the login and registration pages.
// `withNames` adds first and last name fields (registration).
export default function AuthForm({ submitLabel, onSubmit, notice, footer, withNames = false }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function buildValues() {
    if (!withNames) return { email, password };
    return { firstName: firstName.trim(), lastName: lastName.trim(), email, password };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(buildValues());
    } catch (err) {
      setError(toFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      {notice}
      {withNames && (
        <>
          <FormField
            id="first-name"
            label="First name"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
          <FormField
            id="last-name"
            label="Last name"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            required
          />
        </>
      )}
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete={withNames ? 'new-password' : 'current-password'}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : submitLabel}
      </button>
      {footer && <p className="form-footer">{footer}</p>}
    </form>
  );
}
