import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

export const getAllPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, start_date, end_date } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        p.id, p.amount, p.currency, p.status, p.created_at,
        p.razorpay_payment_id, p.razorpay_order_id,
        u.full_name as patient_name, u.phone as patient_phone, u.email as patient_email,
        a.start_time as appointment_time, a.mode as appointment_mode,
        au.full_name as expert_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN appointments a ON p.appointment_id = a.id
      LEFT JOIN experts e ON a.expert_id = e.id
      LEFT JOIN admin_users au ON e.admin_user_id = au.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (status && status !== 'all') {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (start_date) {
      query += ` AND p.created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND p.created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE 1=1';
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (status && status !== 'all') {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (start_date) {
      countQuery += ` AND created_at >= $${countParamIndex}`;
      countParams.push(start_date);
      countParamIndex++;
    }
    if (end_date) {
      countQuery += ` AND created_at <= $${countParamIndex}`;
      countParams.push(end_date);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
          totalItems: parseInt(countResult.rows[0].total),
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
};

export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*, 
        u.full_name as patient_name, u.phone as patient_phone, u.email as patient_email,
        a.start_time, a.end_time, a.mode as appointment_mode,
        au.full_name as expert_name, au.email as expert_email
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id
       LEFT JOIN appointments a ON p.appointment_id = a.id
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment' });
  }
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, razorpay_payment_id } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const result = await pool.query(
      `UPDATE payments 
       SET status = $1, 
           razorpay_payment_id = COALESCE($2, razorpay_payment_id)
       WHERE id = $3
       RETURNING *`,
      [status, razorpay_payment_id || null, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    if (status === 'completed' && result.rows[0].appointment_id) {
      await pool.query(
        `UPDATE appointments SET status = 'confirmed' WHERE id = $1 AND status = 'scheduled'`,
        [result.rows[0].appointment_id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment' });
  }
};

export const getPaymentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_payments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded_payments,
        COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
        COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as average_transaction
      FROM payments
    `);

    const monthlyRevenue = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        SUM(amount) as revenue,
        COUNT(*) as transaction_count
      FROM payments
      WHERE status = 'completed' 
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) DESC
    `);

    res.status(200).json({
      success: true,
      data: {
        ...stats.rows[0],
        monthly_revenue: monthlyRevenue.rows
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

// ─── PAYMENT LINKS ────────────────────────────────────────────────────────────

export const getPaymentLinks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        pl.id, pl.link_url, pl.expires_at, pl.is_used,
        p.amount, p.currency, p.status as payment_status,
        u.full_name as patient_name, u.phone as patient_phone,
        au.full_name as expert_name,
        a.start_time as appointment_time, a.mode as appointment_mode,
        a.id as appointment_id
      FROM payment_links pl
      LEFT JOIN appointments a ON pl.appointment_id = a.id
      LEFT JOIN payments p ON a.payment_id = p.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN experts e ON a.expert_id = e.id
      LEFT JOIN admin_users au ON e.admin_user_id = au.id
      ORDER BY pl.expires_at DESC
      LIMIT 100
    `);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get payment links error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment links' });
  }
};

export const generatePaymentLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { appointment_id, amount, send_sms } = req.body;

    if (!appointment_id || !amount) {
      res.status(400).json({ success: false, message: 'appointment_id and amount are required' });
      return;
    }

    const apptResult = await pool.query(
      `SELECT a.id, a.mode, u.full_name, u.phone, u.email, au.full_name as expert_name
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       WHERE a.id = $1`,
      [appointment_id]
    );

    if (apptResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    const appt = apptResult.rows[0];
    const shortId = appointment_id.split('-')[0];
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const baseUrl = process.env.PATIENT_APP_URL || 'https://nila-health.vercel.app';
    const linkUrl = `${baseUrl}/pay/${appointment_id}?amount=${amount}&ref=${shortId}`;

    // Only insert columns that exist in the payment_links table
    await pool.query(
      `INSERT INTO payment_links (appointment_id, user_phone, user_email, link_url, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [appointment_id, appt.phone || null, appt.email || null, linkUrl, expiresAt]
    );

    // Ensure payment row exists / update amount (no unique constraint on appointment_id)
    const existingPayment = await pool.query(
      `SELECT id FROM payments WHERE appointment_id = $1 AND status = 'pending' LIMIT 1`,
      [appointment_id]
    );

    if (existingPayment.rows.length > 0) {
      await pool.query(
        `UPDATE payments SET amount = $1 WHERE id = $2`,
        [amount, existingPayment.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO payments (appointment_id, user_id, amount, currency, status)
         SELECT a.id, a.user_id, $2, 'INR', 'pending'
         FROM appointments a WHERE a.id = $1`,
        [appointment_id, amount]
      );
    }

    // Log SMS (wire up Twilio here when ready)
    if (send_sms && appt.phone) {
      const msg = `Hi ${appt.full_name || 'Patient'}, please complete your payment of ₹${amount} for your appointment with Dr. ${appt.expert_name}. Pay here: ${linkUrl} (valid 48 hrs) - Nila Healthcare`;
      console.log(`SMS to ${appt.phone}: ${msg}`);
    }

    res.status(201).json({
      success: true,
      message: 'Payment link generated successfully',
      data: {
        link_url: linkUrl,
        expires_at: expiresAt,
        patient_name: appt.full_name,
        patient_phone: appt.phone,
        sms_sent: !!(send_sms && appt.phone),
      }
    });
  } catch (error: any) {
    console.error('Generate payment link error:', error);
    res.status(500).json({ success: false, message: `Failed to generate payment link: ${error.message}` });
  }
};

export const resendPaymentLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT pl.link_url, pl.expires_at, u.full_name, u.phone, p.amount, au.full_name as expert_name
       FROM payment_links pl
       LEFT JOIN appointments a ON pl.appointment_id = a.id
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       LEFT JOIN payments p ON a.payment_id = p.id
       WHERE pl.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Payment link not found' });
      return;
    }

    const link = result.rows[0];

    if (link.phone) {
      const msg = `Hi ${link.full_name || 'Patient'}, reminder: please complete your payment of ₹${link.amount} for your appointment with Dr. ${link.expert_name}. Pay here: ${link.link_url} - Nila Healthcare`;
      console.log(`SMS to ${link.phone}: ${msg}`);
    }

    res.status(200).json({ success: true, message: 'Payment link resent via SMS' });
  } catch (error) {
    console.error('Resend payment link error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend payment link' });
  }
};

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      const paymentResult = await pool.query(
        `UPDATE payments 
         SET status = 'completed', 
             razorpay_payment_id = $1,
             razorpay_signature = $2
         WHERE razorpay_order_id = $3
         RETURNING appointment_id`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id]
      );

      if (paymentResult.rows[0]?.appointment_id) {
        await pool.query(
          `UPDATE appointments SET status = 'confirmed' WHERE id = $1 AND status = 'scheduled'`,
          [paymentResult.rows[0].appointment_id]
        );
      }

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};
