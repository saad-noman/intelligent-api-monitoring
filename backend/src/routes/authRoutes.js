import { Router } from 'express';
import { register, login, logout, getCurrentAccount } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
// Logout stays public so a client can always end its session, whatever its state.
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentAccount);

export default router;
