import { Router } from 'express';
import * as patientController from '../controllers/patient.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', patientController.getAllPatients);
router.get('/stats', patientController.getPatientStats);
router.get('/:id', patientController.getPatientById);
router.post('/', patientController.createPatient);
router.post('/:id/send-otp-email', patientController.sendOTPToEmail);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);

export default router;
