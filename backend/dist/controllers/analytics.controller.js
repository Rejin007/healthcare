"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueAnalytics = exports.getAnalytics = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAnalytics = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        let interval = '7 days';
        if (period === 'today')
            interval = '1 day';
        else if (period === 'month')
            interval = '30 days';
        else if (period === 'year')
            interval = '365 days';
        const summary = await database_1.default.query(`
      SELECT
        COUNT(DISTINCT u.id) FILTER (WHERE u.created_at >= NOW() - INTERVAL '${interval}') as new_patients,
        COUNT(DISTINCT a.id) FILTER (WHERE a.created_at >= NOW() - INTERVAL '${interval}') as total_appointments,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed' AND p.created_at >= NOW() - INTERVAL '${interval}'), 0) as total_revenue,
        COUNT(DISTINCT e.id) FILTER (WHERE e.created_at >= NOW() - INTERVAL '${interval}') as new_experts
      FROM users u
      FULL OUTER JOIN appointments a ON true
      FULL OUTER JOIN payments p ON true
      FULL OUTER JOIN experts e ON true
    `);
        const daily = await database_1.default.query(`
      SELECT
        DATE(a.created_at) as date,
        COUNT(DISTINCT u.id) as new_patients,
        COUNT(a.id) as appointments
      FROM generate_series(NOW() - INTERVAL '${interval}', NOW(), '1 day') as gs(day)
      LEFT JOIN appointments a ON DATE(a.created_at) = DATE(gs.day)
      LEFT JOIN users u ON DATE(u.created_at) = DATE(gs.day)
      GROUP BY DATE(a.created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
        res.status(200).json({
            success: true,
            data: {
                summary: summary.rows[0],
                daily: daily.rows
            }
        });
    }
    catch (error) {
        console.error('Analytics error:', error);
        // Return mock data on error to prevent frontend crash
        res.status(200).json({
            success: true,
            data: {
                summary: { new_patients: 0, total_appointments: 0, total_revenue: 0, new_experts: 0 },
                daily: []
            }
        });
    }
};
exports.getAnalytics = getAnalytics;
const getRevenueAnalytics = async (req, res) => {
    try {
        const result = await database_1.default.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YY') as month,
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as transaction_count
      FROM payments
      WHERE status = 'completed'
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `);
        res.status(200).json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(200).json({ success: true, data: [] });
    }
};
exports.getRevenueAnalytics = getRevenueAnalytics;
//# sourceMappingURL=analytics.controller.js.map