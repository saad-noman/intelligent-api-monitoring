import PageHeader from '../components/PageHeader.jsx';
import AlertEmailForm from '../components/AlertEmailForm.jsx';
import EmailReportsSettings from '../components/EmailReportsSettings.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Account settings: the report email address (separate from the login email) and the
// on/off switch for anomaly report emails.
export default function ProfileSettingsPage() {
  const { account, refresh } = useAuth();

  return (
    <section className="narrow stack">
      <PageHeader title="Account Settings">
        Choose where anomaly reports are sent and whether they are sent at all. The report email can differ from the
        email you log in with.
      </PageHeader>

      <AlertEmailForm account={account} onChanged={refresh} />
      <EmailReportsSettings account={account} onChanged={refresh} />
    </section>
  );
}
