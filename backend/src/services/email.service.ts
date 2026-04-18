import nodemailer from 'nodemailer';

const OTP_EXPIRY_MINUTES = 10;

// ── Create transporter (Gmail) ────────────────────────────────────────────────
// Requires in .env:
//   EMAIL_USER=your_gmail@gmail.com
//   EMAIL_PASS=your_gmail_app_password   ← NOT your real password, an App Password
//
// How to get App Password:
//   Google Account → Security → 2-Step Verification → App Passwords → Create
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

// ── Send OTP via Email ────────────────────────────────────────────────────────
export async function sendOTPviaEmail(
  toEmail: string,
  otp: string,
  patientName?: string
): Promise<{ sent: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('[Email] Not configured — EMAIL_USER and EMAIL_PASS required in .env');
    return { sent: false, error: 'Email not configured' };
  }

  const displayName = patientName || 'there';

  const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: auto;
                background: #0f172a; border-radius: 16px; overflow: hidden;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0891b2, #1d4ed8);
                  padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;
                   letter-spacing: -0.5px;">Nila Healthcare</h1>
        <p style="margin: 6px 0 0; color: rgba(255,255,255,0.75); font-size: 13px;">
          One-Time Password
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        <p style="margin: 0 0 16px; color: #cbd5e1; font-size: 15px;">
          Hello <strong style="color: #e2e8f0;">${displayName}</strong>,
        </p>
        <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Your one-time password for Nila Healthcare is:
        </p>

        <!-- OTP Box -->
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px;
                    padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 42px; font-weight: 700; letter-spacing: 12px;
                       color: #22d3ee; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>

        <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-align: center;">
          ⏱ Valid for <strong>${OTP_EXPIRY_MINUTES} minutes</strong> only.
        </p>
        <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center;">
          🔒 Do not share this OTP with anyone.
        </p>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid #1e293b; padding: 16px 32px; text-align: center;">
        <p style="margin: 0; color: #475569; font-size: 12px;">
          If you didn't request this, please ignore this email.
        </p>
        <p style="margin: 6px 0 0; color: #334155; font-size: 11px;">
          © ${new Date().getFullYear()} Nila Healthcare. All rights reserved.
        </p>
      </div>
    </div>
  `;

  try {
    console.log(`[Email] Sending OTP to ${toEmail}`);
    await transporter.sendMail({
      from: `"Nila Healthcare" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${otp} is your Nila Healthcare OTP`,
      html,
    });
    console.log(`[Email] ✅ OTP sent to ${toEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.error(`[Email] ❌ Failed to send to ${toEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
}
