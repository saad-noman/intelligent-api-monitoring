import { Router } from 'express';
import { listActiveAlerts } from '../controllers/alertsController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/', requireAuth, listActiveAlerts);

export default router;
