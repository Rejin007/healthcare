import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAllAppointments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAppointmentById: (req: Request, res: Response) => Promise<void>;
export declare const createAppointment: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateAppointmentStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getAvailableSlots: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=appointment.controller.d.ts.map