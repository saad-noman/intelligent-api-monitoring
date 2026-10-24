import { Router } from 'express';
import {
  listActiveAlerts,
  getAlertById,
  updateAlertStatus,
  deleteAlert,
  deleteAllAlerts,
  emailActiveAlerts,
  emailAlert,
  analyzeAlert,
} from '../controllers/alertsController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/', requireAuth, listActiveAlerts);
router.delete('/', requireAuth, deleteAllAlerts);
router.post('/report', requireAuth, emailActiveAlerts);
router.get('/:alertId', requireAuth, getAlertById);
router.patch('/:alertId/status', requireAuth, updateAlertStatus);
router.delete('/:alertId', requireAuth, deleteAlert);
router.post('/:alertId/report', requireAuth, emailAlert);
router.post('/:alertId/analyze', requireAuth, analyzeAlert);

export default router;
