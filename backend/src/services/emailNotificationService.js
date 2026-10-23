// Coordinates anomaly-alert emails for an authenticated user.
// Planned flow: look up the recipient via userService.getAlertEmail(ownerId) (never the
// account email), then hand the message to the email-notifications module for delivery.
import { NotImplementedError } from '../utils/errors.js';

export async function notifyAnomalies(ownerId, anomalies) {
  throw new NotImplementedError('emailNotificationService.notifyAnomalies');
}
