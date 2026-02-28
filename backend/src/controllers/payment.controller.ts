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
    const { status, razorpay_payment_id, razorpay_signature } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const result = await pool.query(
      `UPDATE payments 
       SET status = $1, 
           razorpay_payment_id = COALESCE($2, razorpay_payment_id),
           razorpay_signature = COALESCE($3, razorpay_signature)
       WHERE id = $4
       RETURNING *`,
      [status, razorpay_payment_id, razorpay_signature, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Payment not found' });
      return;
    }

    // If payment completed, confirm appointment
    if (status === 'completed' && result.rows[0].appointment_id) {
      await pool.query(
        'UPDATE appointments SET status = $1 WHERE id = $2',
        ['confirmed', result.rows[0].appointment_id]
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

export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      await pool.query(
        `UPDATE payments 
         SET status = 'completed', 
             razorpay_payment_id = $1,
             razorpay_signature = $2
         WHERE razorpay_order_id = $3`,
        [razorpay_payment_id, razorpay_signature, razorpay_order_id]
      );

      res.status(200).json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};
