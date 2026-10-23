// Public interface of the email-notification module: formats a human-readable anomaly
// alert and delivers it through the email provider. The recipient is always supplied by
// the caller (emailNotificationService); this module never looks up users itself.
import { NotImplementedError } from '../../utils/errors.js';

export async function sendAnomalyAlert({ to, anomalies }) {
  throw new NotImplementedError('email-notifications.sendAnomalyAlert');
}
