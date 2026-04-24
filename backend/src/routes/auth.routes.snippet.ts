// In your auth router file (e.g. src/routes/auth.routes.ts)
// Add these two lines alongside your existing routes:

import { adminGenerateOtp, adminVerifyOtp } from '../controllers/adminAuth.controller';

router.post('/admin/generate-otp', adminGenerateOtp);
router.post('/admin/verify-otp',   adminVerifyOtp);


// ── .env variables to add ─────────────────────────────────────────────────────
// EMAIL_USER=your-gmail@gmail.com
// EMAIL_PASS=your-app-password        ← Gmail → Manage Account → App Passwords
// NODE_ENV=development                ← remove in production


// ── Install nodemailer if not already installed ───────────────────────────────
// npm install nodemailer
// npm install --save-dev @types/nodemailer
