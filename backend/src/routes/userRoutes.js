import { Router } from 'express';
import {
  getEmailSettings,
  updateAlertEmail,
  removeAlertEmail,
  updateEmailReports,
} from '../controllers/userController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// "me" always resolves to the authenticated user; other users' settings are not addressable.
router.get('/me/email-settings', requireAuth, getEmailSettings);
router.patch('/me/alert-email', requireAuth, updateAlertEmail);
router.delete('/me/alert-email', requireAuth, removeAlertEmail);
router.patch('/me/email-reports', requireAuth, updateEmailReports);

export default router;
