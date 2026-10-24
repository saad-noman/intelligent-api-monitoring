// Coordinates anomaly-report emails for an authenticated user. The recipient is the
// user's saved report email, never the account email, and nothing is sent while the
// user has email reports switched off in Account Settings.
// Always resolves to { status, message }; delivery problems are logged, not thrown.
import { logger } from '../utils/logger.js';
import { getEmailReportSettings } from './userService.js';
import { isEmailConfigured, sendAnomalyAlert } from '../modules/email-notifications/index.js';

export const EMAIL_STATUS = { sent: 'sent', skipped: 'skipped', failed: 'failed' };

function skipped(message) {
  return { status: EMAIL_STATUS.skipped, message };
}

// `alerts`: monitor results or stored alert views (same api_name/anomalies/explanation shape).
export async function notifyAnomalies(ownerId, alerts) {
  if (alerts.length === 0) return skipped('There are no anomalies to report.');

  const { alertEmail, enabled } = await getEmailReportSettings(ownerId);
  if (!enabled) return skipped('Email reports are turned off in Account Settings.');
  if (!alertEmail) return skipped('No report email address is saved in Account Settings.');
  if (!isEmailConfigured()) return skipped('Email delivery is not configured on the server.');

  try {
    await sendAnomalyAlert({ to: alertEmail, anomalies: alerts });
    return { status: EMAIL_STATUS.sent, message: `Anomaly report sent to ${alertEmail}.` };
  } catch (error) {
    logger.error(`Sending anomaly report failed: ${error.name}: ${error.message}`);
    return { status: EMAIL_STATUS.failed, message: 'The anomaly report email could not be sent.' };
  }
}
