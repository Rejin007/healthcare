import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/stats', dashboardController.getDashboardStats);
router.get('/top-experts', dashboardController.getTopExperts);
router.get('/recent-appointments', dashboardController.getRecentAppointments);

export default router;
