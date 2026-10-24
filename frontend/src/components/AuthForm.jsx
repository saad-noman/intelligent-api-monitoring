import { useState } from 'react';
import FormField from './FormField.jsx';
import StatusMessage from './StatusMessage.jsx';

// Shared email + password form used by the login and registration pages.
export default function AuthForm({ submitLabel, onSubmit, notice, footer }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      {notice}
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
        autoComplete="current-password"
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
