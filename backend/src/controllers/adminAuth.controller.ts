// src/controllers/adminAuth.controller.ts
// Add these two handlers to your existing auth router

import { Request, Response } from 'express';
import nodemailer from 'nodemailer';   // npm install nodemailer @types/nodemailer
import { Admin } from '../models/Admin'; // adjust path to your Admin/User model

// In-memory OTP store (replace with Redis or DB field if you have them)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// ── Helper: generate 6-digit OTP ─────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Helper: send email ────────────────────────────────────────────────────────
const sendOtpEmail = async (to: string, otp: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',           // or 'smtp', 'sendgrid', etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  // App password if Gmail
    },
  });

  await transporter.sendMail({
    from: `"Nila Healthcare" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your Admin Login OTP',
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto">
        <h2 style="color:#06b6d4">Nila Healthcare</h2>
        <p>Your one-time login code is:</p>
        <h1 style="letter-spacing:0.4em;color:#1e293b">${otp}</h1>
        <p style="color:#64748b;font-size:13px">
          This OTP expires in <strong>10 minutes</strong>.
          Do not share it with anyone.
        </p>
      </div>
    `,
  });
};

// ── Mask email for display: rej***@gmail.com ─────────────────────────────────
const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 3)}***@${domain}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/admin/generate-otp
// Body: { phone: "+919876543210" }
// ─────────────────────────────────────────────────────────────────────────────
export const adminGenerateOtp = async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    // Find admin/expert by phone number
    const admin = await Admin.findOne({ phone });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found for this number',
      });
    }

    if (!admin.email) {
      return res.status(400).json({
        success: false,
        message: 'No email linked to this account. Contact your system administrator.',
      });
    }

    // Generate & store OTP (10-minute expiry)
    const otp = generateOtp();
    otpStore.set(phone, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

    // Send to admin's registered email
    await sendOtpEmail(admin.email, otp);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to registered email',
      data: {
        maskedEmail: maskEmail(admin.email),
        // Remove the line below in production — only for dev/testing
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      },
    });
  } catch (err) {
    console.error('adminGenerateOtp error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP. Try again.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/admin/verify-otp
// Body: { phone: "+919876543210", otp: "123456" }
// ─────────────────────────────────────────────────────────────────────────────
export const adminVerifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    const record = otpStore.get(phone);
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP not found. Request a new one.' });
    }
    if (Date.now() > record.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: 'OTP has expired. Request a new one.' });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    // OTP valid — clear it and issue token
    otpStore.delete(phone);

    const admin = await Admin.findOne({ phone });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Generate your JWT the same way adminLogin does
    const accessToken = admin.generateAuthToken(); // adjust to match your existing method

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
        },
      },
    });
  } catch (err) {
    console.error('adminVerifyOtp error:', err);
    return res.status(500).json({ success: false, message: 'Verification failed. Try again.' });
  }
};
