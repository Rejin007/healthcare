import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getReportSummary: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getMonthlyReport: (req: AuthRequest, res: Response) => Promise<void>;
export declare const exportReport: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=reports.controller.d.ts.map