import { Router } from 'express';
import { listActivity, deleteActivity, clearActivity } from '../controllers/activityController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/', requireAuth, listActivity);
router.delete('/', requireAuth, clearActivity);
router.delete('/:activityId', requireAuth, deleteActivity);

export default router;
