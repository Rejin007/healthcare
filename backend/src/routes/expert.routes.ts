import { Router } from 'express';
import * as expertController from '../controllers/expert.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', expertController.getAllExperts);
router.get('/:id', expertController.getExpertById);

// Protected routes
router.use(authenticateToken);
router.post('/', expertController.createExpert);
router.put('/:id', expertController.updateExpert);

export default router;
