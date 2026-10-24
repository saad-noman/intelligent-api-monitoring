import { Router } from 'express';
import {
  listActiveAlerts,
  getAlertById,
  updateAlertStatus,
  deleteAlert,
  emailActiveAlerts,
  emailAlert,
} from '../controllers/alertsController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/', requireAuth, listActiveAlerts);
router.post('/report', requireAuth, emailActiveAlerts);
router.get('/:alertId', requireAuth, getAlertById);
router.patch('/:alertId/status', requireAuth, updateAlertStatus);
router.delete('/:alertId', requireAuth, deleteAlert);
router.post('/:alertId/report', requireAuth, emailAlert);

export default router;
