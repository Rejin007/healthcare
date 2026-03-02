import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateProfile: (req: AuthRequest, res: Response) => Promise<void>;
export declare const changePassword: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getSystemInfo: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=settings.controller.d.ts.map