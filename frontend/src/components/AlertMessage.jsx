import FormattedText from './FormattedText.jsx';
import { ANALYSIS_STATUS } from '../utils/monitoringData.js';

// The AI-written alert text of one anomaly. When the AI analysis did not complete, this
// says so with the reason; no alert text is ever made up in its place.
// `retryHint`: where the user can run the analysis again (differs per page).
export default function AlertMessage({ item, retryHint }) {
  if (item.analysisStatus === ANALYSIS_STATUS.completed && item.explanation) {
    return (
      <>
        <span className="section-label">AI alert</span>
        <FormattedText text={item.explanation} />
      </>
    );
  }

  return (
    <>
      <span className="section-label">AI analysis not completed</span>
      <p className="muted">
        The AI analysis could not be completed for this anomaly{item.analysisError ? ` (${item.analysisError})` : ''}.
        {retryHint && ` ${retryHint}`}
      </p>
    </>
  );
}
