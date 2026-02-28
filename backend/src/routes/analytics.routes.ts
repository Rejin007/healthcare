import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.get('/', analyticsController.getAnalytics);
router.get('/revenue', analyticsController.getRevenueAnalytics);

export default router;
