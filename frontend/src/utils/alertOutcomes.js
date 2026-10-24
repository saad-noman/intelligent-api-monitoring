// { status, message } outcomes of alert actions, shown with OutcomeNotice.
export const ALERT_OUTCOMES = {
  deleted: (alertId) => ({ status: 'done', message: `Alert ${alertId} was deleted.` }),
  allDeleted: (count) => ({ status: 'done', message: `${count} alert(s) were deleted.` }),
  statusChanged: (active) => ({ status: 'done', message: active ? 'Alert reopened.' : 'Alert marked as resolved.' }),
  analyzed: (alert) =>
    alert.analysisError
      ? { status: 'failed', message: `The AI analysis could not be completed (${alert.analysisError}).` }
      : { status: 'done', message: 'AI analysis completed.' },
  copied: (alertId) => ({ status: 'done', message: `Alert ID ${alertId} copied to the clipboard.` }),
  copyFailed: () => ({ status: 'failed', message: 'The alert ID could not be copied. Please copy it manually.' }),
  failed: (message) => ({ status: 'failed', message }),
};
