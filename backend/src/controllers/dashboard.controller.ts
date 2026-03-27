import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [patients, experts, appointments, revenue, modes] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total FROM experts WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as total FROM appointments'),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"),
      pool.query(`
        SELECT
          COALESCE(mode, 'unknown') as mode,
          COUNT(*)::int as count
        FROM appointments
        GROUP BY mode
        ORDER BY mode
      `),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_patients:      parseInt(patients.rows[0].total),
        active_experts:      parseInt(experts.rows[0].total),
        total_appointments:  parseInt(appointments.rows[0].total),
        total_revenue:       parseFloat(revenue.rows[0].total),
        appointment_modes:   modes.rows,   // [{ mode:'online', count:8 }, { mode:'inperson', count:4 }]
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// Dedicated endpoint — frontend calls this independently so it never
// breaks if the stats response changes shape.
export const getConsultationModes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(mode, 'unknown') as mode,
        COUNT(*)::int as count
      FROM appointments
      GROUP BY mode
      ORDER BY mode
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Consultation modes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch consultation modes' });
  }
};

export const getTopExperts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await pool.query(
      `SELECT e.id, au.full_name, e.bio, e.experience_years,
        COUNT(DISTINCT a.id) as total_patients
       FROM experts e
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       LEFT JOIN appointments a ON e.id = a.expert_id
       WHERE e.is_active = true
       GROUP BY e.id, au.full_name, e.bio, e.experience_years
       ORDER BY total_patients DESC LIMIT $1`,
      [limit]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Top experts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch experts' });
  }
};

export const getRecentAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await pool.query(
      `SELECT a.id, a.start_time, a.end_time, a.mode, a.status, a.created_at,
        u.full_name as user_name, u.phone as user_phone,
        au.full_name as expert_name
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       ORDER BY a.created_at DESC LIMIT $1`,
      [limit]
    );
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Recent appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};
