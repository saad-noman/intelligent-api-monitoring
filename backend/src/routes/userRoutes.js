import { Router } from 'express';
import { updateAlertEmail } from '../controllers/userController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// "me" always resolves to the authenticated user; other users' settings are not addressable.
router.patch('/me/alert-email', requireAuth, updateAlertEmail);

export default router;
