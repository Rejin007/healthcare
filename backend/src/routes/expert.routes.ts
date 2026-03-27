import { Router } from 'express';
import * as expertController from '../controllers/expert.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Version check — hit GET /api/experts/version to confirm new controller is deployed
router.get('/version', (req, res) => {
  res.json({ version: 'v2-with-specializations-pricing', timestamp: new Date().toISOString() });
});

// Public routes
router.get('/', expertController.getAllExperts);
router.get('/:id', expertController.getExpertById);

// Protected routes
router.use(authenticateToken);
router.post('/', expertController.createExpert);
router.put('/:id', expertController.updateExpert);

export default router;
