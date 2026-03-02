import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getAllNotifications: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markNotificationRead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const markAllRead: (req: AuthRequest, res: Response) => Promise<void>;
export declare const createNotification: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=notification.controller.d.ts.map