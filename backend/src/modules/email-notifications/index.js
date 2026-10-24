// Public interface of the email-notification module: formats a human-readable anomaly
// report and delivers it through the email provider. The recipient is always supplied by
// the caller (emailNotificationService); this module never looks up users itself.
import { getConfig } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { createEmailProvider } from './providers/emailProvider.js';
import { buildAnomalyReport } from './templates/anomalyReport.js';

export function isEmailConfigured() {
  return createEmailProvider(getConfig().email) !== null;
}

export async function sendAnomalyAlert({ to, anomalies }) {
  const provider = createEmailProvider(getConfig().email);
  if (!provider) throw new Error('Email provider is not configured.');
  await provider.send({ to, ...buildAnomalyReport(anomalies) });
}

// Startup check: logs whether SMTP is configured and reachable. Never throws, so a mail
// problem cannot stop the server; reports are then skipped or marked failed.
export async function checkEmailDelivery() {
  const provider = createEmailProvider(getConfig().email);
  if (!provider) {
    logger.warn('Email reports disabled: SMTP_HOST and SMTP_FROM are not configured.');
    return;
  }
  try {
    await provider.verify();
    logger.info('SMTP connection verified; email reports can be sent.');
  } catch (error) {
    logger.error(`SMTP verification failed: ${error.name}: ${error.message}`);
  }
}
