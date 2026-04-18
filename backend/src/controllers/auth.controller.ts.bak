import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import {
  generateOTPCode,
  saveOTPtoDB,
  verifyOTPFromDB,
  sendOTPviaSMS,
} from '../services/otp.service';
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

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (raw.trim().startsWith('+')) return raw.trim();
  return `+${digits}`;
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

// ── GENERATE OTP ──────────────────────────────────────────────────────────────
// THE ONLY FLOW — no Twilio Verify, no dual-code confusion:
//   1. Generate our own 6-digit code
//   2. Save to DB (source of truth, UTC-safe expiry)
//   3. Try to send via Twilio SMS (Messages API, not Verify)
//   4. verifyOTP always checks DB — SMS is best-effort delivery only
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

    // Step 1+2: Generate code and save to DB — this ALWAYS runs first
    const otp = generateOTPCode();
    await saveOTPtoDB(user.id, otp);
    console.log(`[Auth] OTP saved to DB for user ${user.id}`);

    // Step 3: Try to deliver via SMS (best-effort)
    const phoneE164 = normalizePhone(user.phone);
    console.log(`[Auth] Attempting SMS to ${phoneE164}`);

    const smsResult = await sendOTPviaSMS(phoneE164, otp);

    if (smsResult.sent) {
      console.log(`[Auth] ✅ SMS delivered to ${phoneE164}`);
      res.status(200).json({
        success: true,
        message: 'OTP sent to your mobile. Valid for 10 minutes.',
        data: { phone: rawPhone, smsSent: true },
      });
      return;
    }

    // SMS failed but OTP is safely in DB
    // In development: expose OTP in response so dev/admin can test
    // In production: admin must check server logs
    console.warn(`[Auth] SMS failed: ${smsResult.error}`);
    console.log(`[Auth] ⚠️  OTP for ${user.id} → ${otp}  (check server logs)`);

    res.status(200).json({
      success: true,
      message: smsResult.error === 'SMS not configured'
        ? 'OTP generated (SMS not configured). Check server logs or enable dev mode.'
        : `OTP generated but SMS failed: ${smsResult.error}`,
      data: {
        phone: rawPhone,
        smsSent: false,
        // Always expose in development; never in production
        ...(process.env.NODE_ENV === 'development' && { otp }),
      },
    });
  } catch (error) {
    console.error('[Auth] generateOTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
};

// ── VERIFY OTP ────────────────────────────────────────────────────────────────
// Always verifies against DB. One code, one source of truth.
// SMS delivery is irrelevant to verification logic.
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

    // Check DB — only source of truth
    const check = await verifyOTPFromDB(user.id, enteredCode);
    console.log(`[Auth] OTP check:`, check);

    if (!check.valid) {
      res.status(400).json({ success: false, message: check.reason || 'Invalid OTP' });
      return;
    }

    // Verified — issue tokens
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