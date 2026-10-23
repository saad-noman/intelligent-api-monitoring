import { Router } from 'express';
import { submitMonitoring, listMonitoringRecords } from '../controllers/monitorController.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// Public: guests and authenticated users may both submit monitoring input.
router.post('/', optionalAuth, submitMonitoring);
// Private: saved history exists only for authenticated users.
router.get('/records', requireAuth, listMonitoringRecords);

export default router;
