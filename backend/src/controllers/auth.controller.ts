import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { sendOTP } from '../services/otp.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const generateOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number required' });
      return;
    }

    let user = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
    let userId: string;

    if (user.rows.length === 0) {
      const newUser = await pool.query(
        'INSERT INTO users (phone) VALUES ($1) RETURNING id',
        [phone]
      );
      userId = newUser.rows[0].id;
    } else {
      userId = user.rows[0].id;
    }

    // Invalidate old OTPs
    await pool.query(
      'UPDATE user_otps SET is_used = true WHERE user_id = $1 AND is_used = false',
      [userId]
    );

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'INSERT INTO user_otps (user_id, otp_code, expires_at) VALUES ($1, $2, $3)',
      [userId, otpCode, expiresAt]
    );

    await sendOTP(phone, otpCode);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        ...(process.env.NODE_ENV === 'development' && { otp: otpCode })
      }
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      res.status(400).json({ success: false, message: 'Phone and OTP required' });
      return;
    }

    const userResult = await pool.query(
      'SELECT id, phone, email, full_name FROM users WHERE phone = $1',
      [phone]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const user = userResult.rows[0];
    const otpResult = await pool.query(
      `SELECT id FROM user_otps 
       WHERE user_id = $1 AND otp_code = $2 
       AND expires_at > NOW() AND is_used = false 
       ORDER BY created_at DESC LIMIT 1`,
      [user.id, otp]
    );

    if (otpResult.rows.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    await pool.query('UPDATE user_otps SET is_used = true WHERE id = $1', [otpResult.rows[0].id]);
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret';

    const accessToken = jwt.sign(
      { id: user.id, type: 'user' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, type: 'user' },
      refreshSecret,
      { expiresIn: '30d' }
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO user_sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password required' });
      return;
    }

    const result = await pool.query(
      `SELECT au.*, r.name as role_name 
       FROM admin_users au
       LEFT JOIN roles r ON au.role_id = r.id
       WHERE au.email = $1 AND au.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const admin = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    const accessToken = jwt.sign(
      { id: admin.id, role_id: admin.role_id, type: 'admin' },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Remove sensitive data before sending
    const { password_hash, ...adminData } = admin;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: adminData, accessToken }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    let user;
    if (req.user.type === 'admin') {
      const result = await pool.query(
        `SELECT au.id, au.full_name, au.phone, au.email, r.name as role_name
         FROM admin_users au
         LEFT JOIN roles r ON au.role_id = r.id
         WHERE au.id = $1`,
        [req.user.id]
      );
      user = result.rows[0];
    } else {
      const result = await pool.query(
        'SELECT id, phone, email, full_name FROM users WHERE id = $1',
        [req.user.id]
      );
      user = result.rows[0];
    }

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user && req.user.type === 'user') {
      await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [req.user.id]);
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};
