import pool from '../config/database';

const OTP_EXPIRY_MINUTES = 10;

// ── Generate 6-digit OTP ──────────────────────────────────────────────────────
export function generateOTPCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Save OTP to DB ────────────────────────────────────────────────────────────
// Uses SQL NOW() + INTERVAL — timezone-safe regardless of server locale.
export async function saveOTPtoDB(userId: string, otp: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM user_otps WHERE user_id = $1', [userId]);
    await client.query(
      `INSERT INTO user_otps (user_id, otp_code, expires_at, is_used)
       VALUES ($1, $2, NOW() + INTERVAL '${OTP_EXPIRY_MINUTES} minutes', false)`,
      [userId, otp]
    );
    await client.query('COMMIT');
    console.log(`[OTP] Saved for user ${userId} (expires ${OTP_EXPIRY_MINUTES} min from now UTC)`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Verify OTP from DB ────────────────────────────────────────────────────────
export async function verifyOTPFromDB(
  userId: string,
  otp: string
): Promise<{ valid: boolean; reason?: string }> {
  // Clean expired rows first
  await pool.query(
    'DELETE FROM user_otps WHERE user_id = $1 AND expires_at < NOW()',
    [userId]
  );

  const result = await pool.query(
    `SELECT id FROM user_otps
     WHERE user_id = $1
       AND otp_code = $2
       AND is_used = false
       AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [userId, otp]
  );

  if (result.rows.length === 0) {
    const anyActive = await pool.query(
      `SELECT id FROM user_otps
       WHERE user_id = $1 AND is_used = false AND expires_at > NOW() LIMIT 1`,
      [userId]
    );
    if (anyActive.rows.length === 0) {
      return { valid: false, reason: 'OTP has expired. Please request a new one.' };
    }
    return { valid: false, reason: 'Invalid OTP. Please check and try again.' };
  }

  await pool.query('DELETE FROM user_otps WHERE id = $1', [result.rows[0].id]);
  console.log(`[OTP] Verified for user ${userId}`);
  return { valid: true };
}

// ── Send OTP via Twilio Messages API ─────────────────────────────────────────
// Sends OUR code (already saved to DB) via direct SMS.
// This is NOT Twilio Verify — we control the code completely.
// Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
export async function sendOTPviaSMS(
  phone: string,
  otp: string
): Promise<{ sent: boolean; error?: string }> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn('[SMS] Twilio not configured — TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER required');
    return { sent: false, error: 'SMS not configured' };
  }

  const messageBody = `Your Nila Healthcare OTP is: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this code.`;

  const postData = new URLSearchParams({
    To:   phone,
    From: from,
    Body: messageBody,
  }).toString();

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  console.log(`[SMS] Sending OTP to ${phone}`);

  return new Promise((resolve) => {
    const https = require('https');
    const req = https.request(
      {
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${sid}/Messages.json`,
        method: 'POST',
        timeout: 10000,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type':  'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[SMS] ✅ Sent to ${phone}, SID: ${json.sid}`);
              resolve({ sent: true });
            } else {
              console.error(`[SMS] ❌ ${res.statusCode}: ${json.message} (code: ${json.code})`);
              resolve({ sent: false, error: `${json.message} (Twilio code: ${json.code})` });
            }
          } catch {
            resolve({ sent: false, error: 'Invalid response from Twilio' });
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ sent: false, error: 'SMS request timed out after 10s' });
    });
    req.on('error', (e: any) => {
      console.error('[SMS] Request error:', e.message);
      resolve({ sent: false, error: e.message });
    });
    req.write(postData);
    req.end();
  });
}

// ── Cleanup expired OTPs ──────────────────────────────────────────────────────
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    const r = await pool.query('DELETE FROM user_otps WHERE expires_at < NOW()');
    if ((r.rowCount ?? 0) > 0) {
      console.log(`[OTP Cleanup] Deleted ${r.rowCount} expired OTP(s)`);
    }
  } catch (err) {
    console.error('[OTP Cleanup] Error:', err);
  }
}