import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public route for payment verification
router.post('/verify', paymentController.verifyPayment);

// Protected routes
router.use(authenticateToken);
router.get('/', paymentController.getAllPayments);
router.get('/stats', paymentController.getPaymentStats);
router.get('/links', paymentController.getPaymentLinks);
router.post('/links/generate', paymentController.generatePaymentLink);
router.post('/links/:id/resend', paymentController.resendPaymentLink);
router.get('/:id', paymentController.getPaymentById);
router.put('/:id/status', paymentController.updatePaymentStatus);

export default router;
