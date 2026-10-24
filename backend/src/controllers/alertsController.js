// Thin HTTP handlers for alert retrieval, changes, and reporting. Queries belong in
// services/alertQueryService.js, changes in services/alertStorageService.js, and email
// delivery in services/emailNotificationService.js.
import { listActiveAlerts as queryActiveAlerts, findAlertById } from '../services/alertQueryService.js';
import {
  updateAlertStatus as saveAlertStatus,
  deleteAlert as removeAlert,
  assignMissingAlertIds,
} from '../services/alertStorageService.js';
import { notifyAnomalies, EMAIL_STATUS } from '../services/emailNotificationService.js';
import { recordActivity, deleteActivitiesForAlert } from '../services/alertActivityService.js';
import { ACTIVITY_ACTIONS } from '../models/AlertActivity.js';
import { normalizeAlertId } from '../utils/alertId.js';
import { AppError } from '../utils/errors.js';
import { parseBoolean } from '../utils/validation.js';

function alertNotFoundError() {
  return new AppError(404, 'ALERT_NOT_FOUND', 'No saved alert was found with this ID.');
}

// Reads and validates the :alertId route parameter.
function parseAlertIdParam(req) {
  const alertId = normalizeAlertId(req.params.alertId);
  if (!alertId) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Alert ID must look like ALR-YYYYMMDD-XXXXXXXX.');
  }
  return alertId;
}

// Loads one of the user's alerts or throws 404.
async function requireAlert(req) {
  const alert = await findAlertById(req.user.id, parseAlertIdParam(req));
  if (!alert) throw alertNotFoundError();
  return alert;
}

// Active alerts for the user; older alerts without an ID get one first.
async function loadActiveAlerts(userId) {
  await assignMissingAlertIds(userId);
  return queryActiveAlerts(userId);
}

// GET /alerts (requireAuth)
export async function listActiveAlerts(req, res) {
  const alerts = await loadActiveAlerts(req.user.id);
  res.json({ alerts, count: alerts.length });
}

// GET /alerts/:alertId (requireAuth): one saved alert by its issue ID, e.g. ALR-20261024-9F2C41AB.
export async function getAlertById(req, res) {
  const alert = await requireAlert(req);
  res.json({ alert });
}

// PATCH /alerts/:alertId/status (requireAuth): body { active: boolean } resolves or reopens an alert.
export async function updateAlertStatus(req, res) {
  const alertId = parseAlertIdParam(req);
  const alert = await saveAlertStatus(req.user.id, alertId, parseBoolean(req.body?.active, 'active'));
  if (!alert) throw alertNotFoundError();
  await recordActivity(req.user.id, alert, alert.active ? ACTIVITY_ACTIONS.reopened : ACTIVITY_ACTIONS.resolved);
  res.json({ alert });
}

// DELETE /alerts/:alertId (requireAuth): permanently deletes one alert.
// The alert's history entries are deleted with it.
export async function deleteAlert(req, res) {
  const alertId = parseAlertIdParam(req);
  const deleted = await removeAlert(req.user.id, alertId);
  if (!deleted) throw alertNotFoundError();
  await deleteActivitiesForAlert(req.user.id, alertId);
  res.status(204).end();
}

// POST /alerts/report (requireAuth): emails the user's active alerts to their report email.
export async function emailActiveAlerts(req, res) {
  const alerts = await loadActiveAlerts(req.user.id);
  const email = await notifyAnomalies(req.user.id, alerts);
  res.json({ email, count: alerts.length });
}

// POST /alerts/:alertId/report (requireAuth): emails one alert to the user's report email.
export async function emailAlert(req, res) {
  const alert = await requireAlert(req);
  const email = await notifyAnomalies(req.user.id, [alert]);
  if (email.status === EMAIL_STATUS.sent) {
    await recordActivity(req.user.id, alert, ACTIVITY_ACTIONS.emailed, email.message);
  }
  res.json({ email, count: 1 });
}
