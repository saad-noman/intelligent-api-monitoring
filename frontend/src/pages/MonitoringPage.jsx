import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import MonitoringInput from '../components/MonitoringInput.jsx';
import MonitoringResults from '../components/MonitoringResults.jsx';
import AnalysisPanel from '../components/AnalysisPanel.jsx';
import StatusMessage from '../components/StatusMessage.jsx';
import GuestNotice from '../components/GuestNotice.jsx';
import { submitMonitoring } from '../services/monitorService.js';
import { toFriendlyMessage } from '../utils/errorMessages.js';
import { AUTH_STATUS, useAuth } from '../context/AuthContext.jsx';

// Entry point for monitoring, available to guests and authenticated users.
// Guest results are shown for the current interaction only and are not saved.
export default function MonitoringPage() {
  const { status } = useAuth();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(apiResponses) {
    setIsSubmitting(true);
    setError(null);
    try {
      setResults(await submitMonitoring(apiResponses));
    } catch (err) {
      setResults(null);
      setError(toFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <PageHeader title="Intelligent API" highlight="Montior">
        Submit API response data (JSON) for AI-generated interpretation.
      </PageHeader>

      <div className="monitor-layout">
        <AnalysisPanel items={results} isLoading={isSubmitting} />

        <div className="stack monitor-workspace">
          {status === AUTH_STATUS.guest && <GuestNotice />}

          <MonitoringInput onSubmit={handleSubmit} isSubmitting={isSubmitting} />

          {isSubmitting && <StatusMessage variant="loading" title="Evaluating API responses…" />}
          {error && (
            <StatusMessage variant="error" title="We couldn't analyze your data">
              {error}
            </StatusMessage>
          )}
          {results && <MonitoringResults items={results} />}
        </div>
      </div>
    </section>
  );
}
