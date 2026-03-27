import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDatabase } from './config/database';
import { cleanupExpiredOTPs } from './services/otp.service';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import expertRoutes from './routes/expert.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import reportsRoutes from './routes/reports.routes';
import settingsRoutes from './routes/settings.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server like Vercel proxy)
    if (!origin) return callback(null, true);

    const allowedPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /\.vercel\.app$/,
      /\.onrender\.com$/,
    ];

    // Also allow any explicit origins from env
    const explicitOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : [];

    if (
      allowedPatterns.some(pattern => pattern.test(origin)) ||
      explicitOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/experts', expertRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const startServer = async (port: number = Number(PORT)) => {
  await connectDatabase();

  const server = app.listen(port, () => {
    console.log('=================================');
    console.log(` Server running on port ${port}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
    console.log(`   API: http://localhost:${port}/api`);
    console.log(`   Health: http://localhost:${port}/health`);
    console.log('=================================');
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`  Port ${port} is busy, trying port ${port + 1}...`);
      server.close();
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer();

// ── OTP cleanup scheduler — runs every 5 minutes ─────────────────────────────
setInterval(async () => {
  await cleanupExpiredOTPs();
}, 5 * 60 * 1000);

// Run once on startup to clear any leftover expired OTPs
cleanupExpiredOTPs();

export default app;