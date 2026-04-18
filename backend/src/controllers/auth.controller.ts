import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import {
  generateOTPCode,
  saveOTPtoDB,
  verifyOTPFromDB,
} from '../services/otp.service';
import { sendOTPviaEmail } from '../services/email.service';
import { AuthRequest } from '../middleware/auth.middleware';

// ── Phone helpers ─────────────────────────────────────────────────────────────
function phoneVariants(raw: string): string[] {
  const digits = raw.replace(/\D/g, '');
  const variants = new Set<string>();
  variants.add(raw.trim());
  const core = digits.slice(-10);
  if (core.length === 10) {
    variants.add(core);
    variants.add(`+91${core}`);
    variants.add(`91${core}`);
    variants.add(`0${core}`);
  }
  return Array.from(variants);
}

async function findUserByPhone(rawPhone: string) {
  const variants = phoneVariants(rawPhone);
  console.log(`[Auth] Phone variants:`, variants);
  const result = await pool.query(
    `SELECT id, phone, email, full_name, is_active
     FROM users WHERE phone = ANY($1::text[]) LIMIT 1`,
    [variants]
  );
  return result.rows[0] || null;
}

// ── GENERATE OTP (sends via Email) ───────────────────────────────────────────
export const generateOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone: rawPhone } = req.body;
    if (!rawPhone) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }

    console.log(`[Auth] generateOTP → "${rawPhone}"`);

    const user = await findUserByPhone(rawPhone);
    if (!user || !user.is_active) {
      res.status(404).json({
        success: false,
        message: 'Mobile number not registered. Please contact the clinic.',
      });
      return;
    }

    // Check patient has an email
    if (!user.email) {
      res.status(400).json({
        success: false,
        message: 'No email address registered for this account. Please contact the clinic.',
      });
      return;
    }

    // Generate OTP and save to DB
    const otp = generateOTPCode();
    await saveOTPtoDB(user.id, otp);
    console.log(`[Auth] OTP saved to DB for user ${user.id}`);

    // Send via Email
    console.log(`[Auth] Sending OTP via email to ${user.email}`);
    const emailResult = await sendOTPviaEmail(user.email, otp, user.full_name);

    if (emailResult.sent) {
      console.log(`[Auth] ✅ OTP email delivered to ${user.email}`);
      res.status(200).json({
        success: true,
        message: `OTP sent to your email ${user.email}. Valid for 10 minutes.`,
        data: { phone: rawPhone, emailSent: true },
      });
      return;
    }

    // Email failed — still usable in development via logs
    console.warn(`[Auth] Email failed: ${emailResult.error}`);
    console.log(`[Auth] ⚠️  OTP for ${user.id} → ${otp}  (check server logs)`);

    res.status(200).json({
      success: true,
      message: emailResult.error === 'Email not configured'
        ? 'OTP generated (Email not configured). Add EMAIL_USER and EMAIL_PASS to .env'
        : `OTP generated but email failed: ${emailResult.error}`,
      data: {
        phone: rawPhone,
        emailSent: false,
        ...(process.env.NODE_ENV === 'development' && { otp }),
      },
    });
  } catch (error) {
    console.error('[Auth] generateOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone: rawPhone, otp } = req.body;
    if (!rawPhone || !otp) {
      res.status(400).json({ success: false, message: 'Phone and OTP are required' });
      return;
    }

    const enteredCode = String(otp).trim();
    console.log(`[Auth] verifyOTP → "${rawPhone}", code: "${enteredCode}"`);

    const user = await findUserByPhone(rawPhone);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    console.log(`[Auth] Found user ${user.id}, phone: "${user.phone}"`);

    const check = await verifyOTPFromDB(user.id, enteredCode);
    console.log(`[Auth] OTP check:`, check);

    if (!check.valid) {
      res.status(400).json({ success: false, message: check.reason || 'Invalid OTP' });
      return;
    }

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const jwtSecret     = process.env.JWT_SECRET     || 'change-this-secret';
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || 'change-this-refresh';

    const accessToken  = jwt.sign({ id: user.id, type: 'user' }, jwtSecret,     { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: user.id, type: 'user' }, refreshSecret, { expiresIn: '30d' });

    await pool.query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 days')
       ON CONFLICT DO NOTHING`,
      [user.id, refreshToken]
    );

    const { is_active, ...userData } = user;
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userData, accessToken, refreshToken },
    });
  } catch (error) {
    console.error('[Auth] verifyOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────────
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }
    const result = await pool.query(
      `SELECT au.*, r.name as role_name FROM admin_users au
       LEFT JOIN roles r ON au.role_id = r.id
       WHERE au.email = $1 AND au.is_active = true`,
      [email]
    );
    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const jwtSecret   = process.env.JWT_SECRET || 'change-this-secret';
    const accessToken = jwt.sign(
      { id: admin.id, role_id: admin.role_id, type: 'admin' },
      jwtSecret,
      { expiresIn: '7d' }
    );
    const { password_hash, ...adminData } = admin;
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: adminData, accessToken },
    });
  } catch (error) {
    console.error('[Auth] adminLogin error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }
    let user;
    if (req.user.type === 'admin') {
      const r = await pool.query(
        `SELECT au.id, au.full_name, au.phone, au.email, r.name as role_name
         FROM admin_users au LEFT JOIN roles r ON au.role_id = r.id WHERE au.id = $1`,
        [req.user.id]
      );
      user = r.rows[0];
    } else {
      const r = await pool.query(
        'SELECT id, phone, email, full_name FROM users WHERE id = $1',
        [req.user.id]
      );
      user = r.rows[0];
    }
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('[Auth] getCurrentUser error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

// ── LOGOUT ────────────────────────────────────────────────────────────────────
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.type === 'user') {
      await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [req.user.id]);
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};
