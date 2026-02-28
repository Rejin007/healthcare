import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.put('/password', settingsController.changePassword);
router.get('/system', settingsController.getSystemInfo);

export default router;
