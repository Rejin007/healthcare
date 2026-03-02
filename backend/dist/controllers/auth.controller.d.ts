import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const generateOTP: (req: Request, res: Response) => Promise<void>;
export declare const verifyOTP: (req: Request, res: Response) => Promise<void>;
export declare const adminLogin: (req: Request, res: Response) => Promise<void>;
export declare const getCurrentUser: (req: AuthRequest, res: Response) => Promise<void>;
export declare const logout: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map