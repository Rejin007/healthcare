"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.getMonthlyReport = exports.getReportSummary = void 0;
const database_1 = __importDefault(require("../config/database"));
// GET /api/reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
const getReportSummary = async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? String(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end ? String(end) : new Date().toISOString().split('T')[0];
        const [patients, appointments, revenue, experts, apptByStatus, topExperts] = await Promise.all([
            // New patients in range
            database_1.default.query(`SELECT COUNT(*) as total, 
          COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2::date + INTERVAL '1 day') as new_in_range
         FROM users WHERE is_active = true`, [startDate, endDate]),
            // Appointments in range
            database_1.default.query(`SELECT COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= $1 AND created_at <= $2::date + INTERVAL '1 day') as in_range,
          COUNT(*) FILTER (WHERE status = 'completed' AND created_at >= $1 AND created_at <= $2::date + INTERVAL '1 day') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled' AND created_at >= $1 AND created_at <= $2::date + INTERVAL '1 day') as cancelled
         FROM appointments`, [startDate, endDate]),
            // Revenue in range
            database_1.default.query(`SELECT 
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'completed' AND created_at >= $1 AND created_at <= $2::date + INTERVAL '1 day'), 0) as range_revenue,
          COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_revenue,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
          COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as avg_transaction
         FROM payments`, [startDate, endDate]),
            // Active experts
            database_1.default.query(`SELECT COUNT(*) as total FROM experts WHERE is_active = true`),
            // Appointments by status
            database_1.default.query(`SELECT status, COUNT(*) as count
         FROM appointments
         WHERE created_at >= $1 AND created_at <= $2::date + INTERVAL '1 day'
         GROUP BY status ORDER BY count DESC`, [startDate, endDate]),
            // Top performing experts in range
            database_1.default.query(`SELECT 
          au.full_name, e.experience_years,
          COUNT(a.id) as appointments_count,
          COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'completed'), 0) as revenue_generated
         FROM experts e
         LEFT JOIN admin_users au ON e.admin_user_id = au.id
         LEFT JOIN appointments a ON e.id = a.expert_id 
           AND a.created_at >= $1 AND a.created_at <= $2::date + INTERVAL '1 day'
         LEFT JOIN payments p ON a.payment_id = p.id
         WHERE e.is_active = true
         GROUP BY e.id, au.full_name, e.experience_years
         ORDER BY appointments_count DESC
         LIMIT 5`, [startDate, endDate]),
        ]);
        res.status(200).json({
            success: true,
            data: {
                dateRange: { start: startDate, end: endDate },
                patients: {
                    total: parseInt(patients.rows[0].total),
                    new_in_range: parseInt(patients.rows[0].new_in_range),
                },
                appointments: {
                    total: parseInt(appointments.rows[0].total),
                    in_range: parseInt(appointments.rows[0].in_range),
                    completed: parseInt(appointments.rows[0].completed),
                    cancelled: parseInt(appointments.rows[0].cancelled),
                },
                revenue: {
                    total_revenue: parseFloat(revenue.rows[0].total_revenue),
                    range_revenue: parseFloat(revenue.rows[0].range_revenue),
                    pending_revenue: parseFloat(revenue.rows[0].pending_revenue),
                    completed_payments: parseInt(revenue.rows[0].completed_payments),
                    avg_transaction: parseFloat(revenue.rows[0].avg_transaction),
                },
                experts: {
                    total: parseInt(experts.rows[0].total),
                },
                appointments_by_status: apptByStatus.rows,
                top_experts: topExperts.rows,
            }
        });
    }
    catch (error) {
        console.error('Report summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch report data' });
    }
};
exports.getReportSummary = getReportSummary;
// GET /api/reports/monthly — last 12 months monthly breakdown
const getMonthlyReport = async (req, res) => {
    try {
        const result = await database_1.default.query(`
      SELECT
        TO_CHAR(month_series, 'Mon YYYY') as month,
        TO_CHAR(month_series, 'YYYY-MM') as month_key,
        COALESCE(appt.appointments, 0) as appointments,
        COALESCE(appt.completed, 0) as completed_appointments,
        COALESCE(pat.new_patients, 0) as new_patients,
        COALESCE(rev.revenue, 0) as revenue
      FROM generate_series(
        DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
        DATE_TRUNC('month', NOW()),
        '1 month'
      ) AS month_series
      LEFT JOIN (
        SELECT
          DATE_TRUNC('month', created_at) as m,
          COUNT(*) as appointments,
          COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM appointments GROUP BY m
      ) appt ON appt.m = month_series
      LEFT JOIN (
        SELECT DATE_TRUNC('month', created_at) as m, COUNT(*) as new_patients
        FROM users WHERE is_active = true GROUP BY m
      ) pat ON pat.m = month_series
      LEFT JOIN (
        SELECT DATE_TRUNC('month', created_at) as m, COALESCE(SUM(amount),0) as revenue
        FROM payments WHERE status = 'completed' GROUP BY m
      ) rev ON rev.m = month_series
      ORDER BY month_series ASC
    `);
        res.status(200).json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch monthly data' });
    }
};
exports.getMonthlyReport = getMonthlyReport;
// GET /api/reports/export?type=payments|appointments|patients&start=&end=
const exportReport = async (req, res) => {
    try {
        const { type = 'appointments', start, end } = req.query;
        const startDate = start ? String(start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end ? String(end) : new Date().toISOString().split('T')[0];
        let rows = [];
        let headers = [];
        if (type === 'appointments') {
            const result = await database_1.default.query(`SELECT 
          a.id, a.mode, a.status, a.start_time, a.end_time,
          u.full_name as patient_name, u.phone as patient_phone,
          au.full_name as expert_name,
          p.amount, p.status as payment_status
         FROM appointments a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN experts e ON a.expert_id = e.id
         LEFT JOIN admin_users au ON e.admin_user_id = au.id
         LEFT JOIN payments p ON a.payment_id = p.id
         WHERE a.created_at >= $1 AND a.created_at <= $2::date + INTERVAL '1 day'
         ORDER BY a.start_time DESC`, [startDate, endDate]);
            headers = ['ID', 'Patient', 'Phone', 'Expert', 'Mode', 'Status', 'Start Time', 'Amount', 'Payment Status'];
            rows = result.rows.map(r => [
                r.id, r.patient_name || 'N/A', r.patient_phone, r.expert_name || 'N/A',
                r.mode, r.status, new Date(r.start_time).toLocaleString(),
                r.amount || 0, r.payment_status || 'N/A'
            ]);
        }
        else if (type === 'payments') {
            const result = await database_1.default.query(`SELECT p.id, p.amount, p.currency, p.status, p.created_at,
          p.razorpay_payment_id, u.full_name as patient_name, u.phone,
          au.full_name as expert_name
         FROM payments p
         LEFT JOIN users u ON p.user_id = u.id
         LEFT JOIN appointments a ON p.appointment_id = a.id
         LEFT JOIN experts e ON a.expert_id = e.id
         LEFT JOIN admin_users au ON e.admin_user_id = au.id
         WHERE p.created_at >= $1 AND p.created_at <= $2::date + INTERVAL '1 day'
         ORDER BY p.created_at DESC`, [startDate, endDate]);
            headers = ['ID', 'Patient', 'Phone', 'Expert', 'Amount', 'Currency', 'Status', 'Transaction ID', 'Date'];
            rows = result.rows.map(r => [
                r.id, r.patient_name || 'N/A', r.phone, r.expert_name || 'N/A',
                r.amount, r.currency, r.status, r.razorpay_payment_id || 'N/A',
                new Date(r.created_at).toLocaleString()
            ]);
        }
        else if (type === 'patients') {
            const result = await database_1.default.query(`SELECT id, full_name, phone, email, is_active, created_at, last_login_at
         FROM users
         WHERE created_at >= $1 AND created_at <= $2::date + INTERVAL '1 day'
           AND is_active = true
         ORDER BY created_at DESC`, [startDate, endDate]);
            headers = ['ID', 'Full Name', 'Phone', 'Email', 'Active', 'Registered', 'Last Login'];
            rows = result.rows.map(r => [
                r.id, r.full_name || 'N/A', r.phone, r.email || 'N/A',
                r.is_active ? 'Yes' : 'No',
                new Date(r.created_at).toLocaleString(),
                r.last_login_at ? new Date(r.last_login_at).toLocaleString() : 'Never'
            ]);
        }
        const csv = [headers, ...rows].map(row => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report-${startDate}-to-${endDate}.csv"`);
        res.send(csv);
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: 'Failed to export report' });
    }
};
exports.exportReport = exportReport;
//# sourceMappingURL=reports.controller.js.map