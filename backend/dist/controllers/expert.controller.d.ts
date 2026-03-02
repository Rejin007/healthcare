import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAllExperts: (req: Request, res: Response) => Promise<void>;
export declare const getExpertById: (req: Request, res: Response) => Promise<void>;
export declare const createExpert: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updateExpert: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=expert.controller.d.ts.map