import { useEffect, useState } from 'react';
import ToggleSwitch from './ToggleSwitch.jsx';
import StatusMessage from './StatusMessage.jsx';
import { getEmailSettings, setEmailReportsEnabled } from '../services/userService.js';
import { toFriendlyMessage } from '../utils/errorMessages.js';
import { useConfirm } from '../context/ConfirmContext.jsx';

// Explains what will happen with the current settings, without promising delivery the
// server cannot make.
function ReportStatus({ enabled, alertEmail, deliveryConfigured }) {
  if (!enabled) {
    return <StatusMessage title="Email reports are off">No anomaly reports will be emailed.</StatusMessage>;
  }
  if (!alertEmail) {
    return (
      <StatusMessage variant="warning" title="No report email saved">
        Save a report email address above to receive anomaly reports.
      </StatusMessage>
    );
  }
  if (deliveryConfigured === false) {
    return (
      <StatusMessage variant="warning" title="Email delivery is not set up on the server">
        Reports are switched on, but the server has no SMTP settings, so emails cannot be sent yet.
      </StatusMessage>
    );
  }
  return (
    <StatusMessage variant="success" title="Email reports are on">
      Reports are emailed to {alertEmail} after each saved monitoring run with anomalies, and when you use
      “Email report” on the Alerts page.
    </StatusMessage>
  );
}

// On/off switch for anomaly report emails. `onChanged` reloads the account afterwards.
export default function EmailReportsSettings({ account, onChanged }) {
  const [deliveryConfigured, setDeliveryConfigured] = useState(null); // null until loaded
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const enabled = account?.emailReportsEnabled !== false;
  const confirm = useConfirm();

  useEffect(() => {
    getEmailSettings()
      .then((settings) => setDeliveryConfigured(Boolean(settings?.deliveryConfigured)))
      .catch(() => setDeliveryConfigured(null));
  }, []);

  async function handleToggle(nextEnabled) {
    if (!nextEnabled) {
      const confirmed = await confirm({
        title: 'Turn off email reports?',
        message: 'No anomaly reports will be emailed until you turn them back on.',
        confirmLabel: 'Turn off',
        tone: 'warning',
      });
      if (!confirmed) return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await setEmailReportsEnabled(nextEnabled);
      await onChanged();
    } catch (err) {
      setError(toFriendlyMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card form-card">
      <h2>Email reporting</h2>
      <ToggleSwitch
        id="email-reports"
        label="Send anomaly reports by email"
        checked={enabled}
        onChange={handleToggle}
        disabled={isSaving}
      />
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      <ReportStatus enabled={enabled} alertEmail={account?.alertEmail} deliveryConfigured={deliveryConfigured} />
    </section>
  );
}
