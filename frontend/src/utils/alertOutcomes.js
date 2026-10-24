// { status, message } outcomes of alert actions, shown with OutcomeNotice.
export const ALERT_OUTCOMES = {
  deleted: (alertId) => ({ status: 'done', message: `Alert ${alertId} was deleted.` }),
  statusChanged: (active) => ({ status: 'done', message: active ? 'Alert reopened.' : 'Alert marked as resolved.' }),
  copied: (alertId) => ({ status: 'done', message: `Alert ID ${alertId} copied to the clipboard.` }),
  copyFailed: () => ({ status: 'failed', message: 'The alert ID could not be copied. Please copy it manually.' }),
  failed: (message) => ({ status: 'failed', message }),
};
