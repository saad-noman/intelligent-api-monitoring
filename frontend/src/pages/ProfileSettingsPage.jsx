import { useState } from 'react';
import FormField from '../components/FormField.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import { updateAlertEmail } from '../services/userService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { NOT_AVAILABLE } from '../utils/format.js';

// Account settings, including the alert-recipient email, which is separate
// from the account's login email.
export default function ProfileSettingsPage() {
  const { account, refresh } = useAuth();
  const [alertEmail, setAlertEmail] = useState(account?.alertEmail ?? '');
  const [result, setResult] = useState(null); // { ok: boolean, message: string }
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setResult(null);
    try {
      await updateAlertEmail(alertEmail.trim());
      await refresh();
      setResult({ ok: true, message: 'Your report email address was saved.' });
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="narrow stack">
      <PageHeader eyebrow="Account settings" title="Email" highlight="Reporting">
        Anomaly reports are sent to the address saved here until you change it.
      </PageHeader>

      <form className="card form-card" onSubmit={handleSubmit}>
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

        {result && <StatusMessage variant={result.ok ? 'success' : 'error'}>{result.message}</StatusMessage>}

        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving…' : account?.alertEmail ? 'Update email' : 'Save email'}
        </button>
      </form>
    </section>
  );
}
