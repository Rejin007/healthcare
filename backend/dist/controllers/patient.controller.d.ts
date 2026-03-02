import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAllPatients: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientById: (req: Request, res: Response) => Promise<void>;
export declare const createPatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const deletePatient: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPatientStats: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=patient.controller.d.ts.map