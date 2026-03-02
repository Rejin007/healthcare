"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentAppointments = exports.getTopExperts = exports.getDashboardStats = void 0;
const database_1 = __importDefault(require("../config/database"));
const getDashboardStats = async (req, res) => {
    try {
        const [patients, experts, appointments, revenue] = await Promise.all([
            database_1.default.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
            database_1.default.query('SELECT COUNT(*) as total FROM experts WHERE is_active = true'),
            database_1.default.query('SELECT COUNT(*) as total FROM appointments'),
            database_1.default.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'")
        ]);
        res.status(200).json({
            success: true,
            data: {
                total_patients: parseInt(patients.rows[0].total),
                active_experts: parseInt(experts.rows[0].total),
                total_appointments: parseInt(appointments.rows[0].total),
                total_revenue: parseFloat(revenue.rows[0].total)
            }
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
const getTopExperts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = await database_1.default.query(`SELECT e.id, au.full_name, e.bio, e.experience_years,
        COUNT(DISTINCT a.id) as total_patients
       FROM experts e
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       LEFT JOIN appointments a ON e.id = a.expert_id
       WHERE e.is_active = true
       GROUP BY e.id, au.full_name, e.bio, e.experience_years
       ORDER BY total_patients DESC LIMIT $1`, [limit]);
        res.status(200).json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Top experts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch experts' });
    }
};
exports.getTopExperts = getTopExperts;
const getRecentAppointments = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = await database_1.default.query(`SELECT a.id, a.start_time, a.end_time, a.mode, a.status, a.created_at,
        u.full_name as user_name, u.phone as user_phone,
        au.full_name as expert_name
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       ORDER BY a.created_at DESC LIMIT $1`, [limit]);
        res.status(200).json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Recent appointments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    }
};
exports.getRecentAppointments = getRecentAppointments;
//# sourceMappingURL=dashboard.controller.js.map