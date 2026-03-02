import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAllPayments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPaymentById: (req: Request, res: Response) => Promise<void>;
export declare const updatePaymentStatus: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getPaymentStats: (req: AuthRequest, res: Response) => Promise<void>;
export declare const verifyPayment: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map