import { useState } from 'react';
import { Link } from 'react-router';
import PageHeader from '../components/PageHeader.jsx';
import MonitoringInput from '../components/MonitoringInput.jsx';
import MonitoringResults from '../components/MonitoringResults.jsx';
import AnalysisPanel from '../components/AnalysisPanel.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import GuestNotice from '../components/GuestNotice.jsx';
import ItemErrors from '../components/ItemErrors.jsx';
import OutcomeNotice from '../components/OutcomeNotice.jsx';
import { getSampleBatch, submitMonitoring } from '../services/monitorService.js';
import { toFriendlyMessage } from '../utils/errorMessages.js';
import { AUTH_STATUS, useAuth } from '../context/AuthContext.jsx';
import { PATHS } from '../routes/paths.js';

// Entry point for monitoring, available to guests and authenticated users.
// Guest results are shown for the current interaction only and are not saved.
export default function MonitoringPage() {
  const { status } = useAuth();
  const [outcome, setOutcome] = useState(null); // { items, errors, summary, persistence, email }
  const [error, setError] = useState(null); // { message, details }
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(apiResponses) {
    setIsSubmitting(true);
    setError(null);
    try {
      setOutcome(await submitMonitoring(apiResponses));
    } catch (err) {
      setOutcome(null);
      setError({ message: toFriendlyMessage(err), details: err.details });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSaved = outcome?.persistence?.status === 'saved';

  return (
    <section className="stack">
      <PageHeader title="Intelligent API" highlight="Monitor">
        Submit API monitoring observations (JSON). Rule-based checks detect anomalies, and each anomaly gets a
        human-readable alert.
      </PageHeader>

      <div className="monitor-layout">
        <AnalysisPanel items={outcome?.items ?? null} isLoading={isSubmitting} canView={isSaved} />

        <div className="stack monitor-workspace">
          {status === AUTH_STATUS.guest && <GuestNotice />}

          <MonitoringInput onSubmit={handleSubmit} onLoadSample={getSampleBatch} isSubmitting={isSubmitting} />

          {isSubmitting && <StatusMessage variant="loading" title="Evaluating API observations…" />}
          {error && (
            <>
              <StatusMessage variant="error" title="We couldn't analyze your data">
                {error.message}
              </StatusMessage>
              <ItemErrors errors={error.details} title="Rejected observations" />
            </>
          )}
          {outcome && (
            <>
              <OutcomeNotice title="Storage" outcome={outcome.persistence}>
                {isSaved && <Link to={PATHS.alerts}>View active alerts →</Link>}
              </OutcomeNotice>
              <OutcomeNotice title="Email report" outcome={status === AUTH_STATUS.authenticated ? outcome.email : null} />
              <ItemErrors errors={outcome.errors} />
              <MonitoringResults items={outcome.items} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
