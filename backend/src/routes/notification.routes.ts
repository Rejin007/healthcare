import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', notificationController.getAllNotifications);
router.post('/', notificationController.createNotification);
router.put('/mark-all-read', notificationController.markAllRead);
router.put('/:id/read', notificationController.markNotificationRead);

export default router;
