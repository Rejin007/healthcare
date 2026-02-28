import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/settings/profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await pool.query(
      `SELECT au.id, au.full_name, au.email, au.phone, au.created_at, r.name as role_name
       FROM admin_users au
       LEFT JOIN roles r ON au.role_id = r.id
       WHERE au.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/settings/profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { full_name, phone } = req.body;

    if (!full_name && !phone) {
      res.status(400).json({ success: false, message: 'Provide at least one field to update' });
      return;
    }

    const result = await pool.query(
      `UPDATE admin_users
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone)
       WHERE id = $3
       RETURNING id, full_name, email, phone`,
      [full_name || null, phone || null, req.user.id]
    );

    res.status(200).json({ success: true, message: 'Profile updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// PUT /api/settings/password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      res.status(400).json({ success: false, message: 'Current and new password required' });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      return;
    }

    const result = await pool.query(
      'SELECT password_hash FROM admin_users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isValid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// GET /api/settings/system
export const getSystemInfo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [dbCheck, counts] = await Promise.all([
      pool.query('SELECT version() as version, NOW() as server_time'),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE is_active = true) as total_patients,
          (SELECT COUNT(*) FROM experts WHERE is_active = true) as total_experts,
          (SELECT COUNT(*) FROM appointments) as total_appointments,
          (SELECT COUNT(*) FROM payments) as total_payments,
          (SELECT COUNT(*) FROM admin_users WHERE is_active = true) as total_admins
      `)
    ]);

    res.status(200).json({
      success: true,
      data: {
        database: {
          connected: true,
          version: dbCheck.rows[0].version,
          server_time: dbCheck.rows[0].server_time,
        },
        counts: counts.rows[0],
        server: {
          node_version: process.version,
          environment: process.env.NODE_ENV,
          uptime_seconds: Math.floor(process.uptime()),
        }
      }
    });
  } catch (error) {
    console.error('System info error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system info' });
  }
};
