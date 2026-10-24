import { Router } from 'express';
import { submitMonitoring, getSampleBatch, listMonitoringRecords } from '../controllers/monitorController.js';
import { optionalAuth } from '../middlewares/optionalAuth.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// Public: guests and authenticated users may both submit monitoring input.
router.post('/', optionalAuth, submitMonitoring);
// Public: the static sample batch file.
router.get('/sample', getSampleBatch);
// Private: saved history exists only for authenticated users.
router.get('/records', requireAuth, listMonitoringRecords);

export default router;
