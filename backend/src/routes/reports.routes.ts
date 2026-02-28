import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/summary', reportsController.getReportSummary);
router.get('/monthly', reportsController.getMonthlyReport);
router.get('/export', reportsController.exportReport);

export default router;
