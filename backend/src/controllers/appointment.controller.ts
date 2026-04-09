import { Request, Response } from 'express';
import pool from '../config/database';

// ── SMS helper (reuses Twilio config from otp.service) ───────────────────────
async function sendSMS(phone: string, message: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV SMS] → ${phone}: ${message}`);
    return;
  }
  try {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from  = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) { console.warn('[SMS] Twilio not configured'); return; }
    const twilio = require('twilio')(sid, token);
    await twilio.messages.create({ body: message, from, to: phone });
    console.log(`[SMS] Sent to ${phone}`);
  } catch (err) {
    console.error('[SMS] Error:', err);
  }
}
import { AuthRequest } from '../middleware/auth.middleware';

export const getAllAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, statuses, expert_id, user_id, date, upcoming } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        a.id, a.start_time, a.end_time, a.mode, a.status, a.created_at,
        a.google_meet_link,
        u.full_name as patient_name, u.phone as patient_phone,
        au.full_name as expert_name,
        p.amount, p.status as payment_status
      FROM appointments a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN experts e ON a.expert_id = e.id
      LEFT JOIN admin_users au ON e.admin_user_id = au.id
      LEFT JOIN payments p ON a.payment_id = p.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Support comma-separated statuses e.g. statuses=scheduled,confirmed
    if (statuses) {
      const statusList = String(statuses).split(',').map(s => s.trim()).filter(Boolean);
      if (statusList.length > 0) {
        const placeholders = statusList.map((_, i) => `$${paramCount + i}`).join(', ');
        query += ` AND a.status IN (${placeholders})`;
        params.push(...statusList);
        paramCount += statusList.length;
      }
    } else if (status) {
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // upcoming=true → only future appointments
    if (upcoming === 'true') {
      query += ` AND a.start_time >= NOW()`;
    }

    if (expert_id) {
      query += ` AND a.expert_id = $${paramCount}`;
      params.push(expert_id);
      paramCount++;
    }

    if (user_id) {
      query += ` AND a.user_id = $${paramCount}`;
      params.push(user_id);
      paramCount++;
    }

    if (date) {
      query += ` AND DATE(a.start_time) = $${paramCount}`;
      params.push(date);
      paramCount++;
    }

    query += ` ORDER BY a.start_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM appointments a
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 1;

    // Mirror the same statuses / status filter used in the main query
    if (statuses) {
      const statusList = String(statuses).split(',').map(s => s.trim()).filter(Boolean);
      if (statusList.length > 0) {
        const placeholders = statusList.map((_, i) => `$${countParamCount + i}`).join(', ');
        countQuery += ` AND a.status IN (${placeholders})`;
        countParams.push(...statusList);
        countParamCount += statusList.length;
      }
    } else if (status) {
      countQuery += ` AND a.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }
    if (upcoming === 'true') {
      countQuery += ` AND a.start_time >= NOW()`;
    }
    if (expert_id) {
      countQuery += ` AND a.expert_id = $${countParamCount}`;
      countParams.push(expert_id);
      countParamCount++;
    }
    if (user_id) {
      countQuery += ` AND a.user_id = $${countParamCount}`;
      countParams.push(user_id);
      countParamCount++;
    }
    if (date) {
      countQuery += ` AND DATE(a.start_time) = $${countParamCount}`;
      countParams.push(date);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: {
        appointments: result.rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
          totalItems: parseInt(countResult.rows[0].total),
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        a.id, a.mode, a.status, a.start_time, a.end_time, a.google_meet_link, a.created_at,
        u.full_name as patient_name, u.phone as patient_phone, u.email as patient_email,
        au.full_name as expert_name, au.phone as expert_phone,
        p.amount, p.status as payment_status, p.razorpay_payment_id
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       LEFT JOIN payments p ON a.payment_id = p.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointment' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { user_id, expert_id, mode, start_time, duration = 30, meet_link } = req.body;

    if (!user_id || !expert_id || !mode || !start_time) {
      await client.query('ROLLBACK');
      res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, expert_id, mode, start_time'
      });
      return;
    }

    // Validate mode
    if (!['online', 'inperson'].includes(mode)) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'Mode must be "online" or "inperson"' });
      return;
    }

    // Validate user exists
    const userCheck = await client.query('SELECT id FROM users WHERE id = $1 AND is_active = true', [user_id]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    // Validate expert exists
    const expertCheck = await client.query('SELECT id FROM experts WHERE id = $1 AND is_active = true', [expert_id]);
    if (expertCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Expert not found' });
      return;
    }

    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + Number(duration) * 60000);

    // Prevent patient from booking more than one appointment per day
    const sameDayCheck = await client.query(
      `SELECT id FROM appointments
       WHERE user_id = $1
       AND DATE(start_time) = DATE($2::timestamptz)
       AND status NOT IN ('cancelled', 'no-show')`,
      [user_id, startTime.toISOString()]
    );

    if (sameDayCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        success: false,
        message: 'Patient already has an appointment on this day. Only one appointment per day is allowed.'
      });
      return;
    }

    // Check for scheduling conflicts
    const conflictCheck = await client.query(
      `SELECT id FROM appointments
       WHERE expert_id = $1 
       AND status NOT IN ('cancelled', 'no-show')
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`,
      [expert_id, startTime, endTime]
    );

    if (conflictCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
      return;
    }

    // Get pricing
    const pricingResult = await client.query(
      'SELECT price FROM expert_pricing WHERE expert_id = $1 AND mode = $2',
      [expert_id, mode]
    );

    const amount = pricingResult.rows.length > 0 ? pricingResult.rows[0].price : 500;

    // Create appointment
    const appointmentResult = await client.query(
      `INSERT INTO appointments (
        user_id, expert_id, mode, start_time, end_time, status, created_by, google_meet_link
      ) VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7)
      RETURNING *`,
      [user_id, expert_id, mode, startTime, endTime, req.user?.type || 'admin', meet_link || null]
    );

    const appointment = appointmentResult.rows[0];

    // For online appointments: use provided link or auto-generate a Jitsi Meet room
    if (mode === 'online') {
      const shortId = appointment.id.replace(/-/g, '').slice(0, 12);
      const finalLink = meet_link || `https://meet.jit.si/nila-${shortId}`;

      // Save to appointments.google_meet_link
      await client.query(
        'UPDATE appointments SET google_meet_link = $1 WHERE id = $2',
        [finalLink, appointment.id]
      );
      // Also save to google_meet_links table
      await client.query(
        'INSERT INTO google_meet_links (appointment_id, meet_url) VALUES ($1, $2)',
        [appointment.id, finalLink]
      );
      appointment.google_meet_link = finalLink;
    }

    // Fetch patient phone for SMS notification
    const patientRow = await client.query(
      'SELECT phone, full_name FROM users WHERE id = $1',
      [user_id]
    );
    const patient = patientRow.rows[0];

    if (patient) {
      // Format appointment date/time for message
      const apptDate = startTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const apptTime = startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      let smsBody = `Hi ${patient.full_name || 'Patient'}, your appointment is confirmed for ${apptDate} at ${apptTime}.`;
      if (meet_link && mode === 'online') {
        smsBody += ` Join here: ${meet_link}`;
      }
      smsBody += ` - Nila Healthcare`;

      // Send SMS (non-blocking — don't fail the booking if SMS fails)
      sendSMS(patient.phone, smsBody).catch(console.error);

      // Save notification record to DB
      await client.query(
        `INSERT INTO notifications (user_id, type, channel, message)
         VALUES ($1, 'appointment_confirmed', 'sms', $2)`,
        [user_id, smsBody]
      );
    }

    // Create payment record
    const paymentResult = await client.query(
      `INSERT INTO payments (
        user_id, appointment_id, amount, currency, status
      ) VALUES ($1, $2, $3, 'INR', 'pending')
      RETURNING id`,
      [user_id, appointment.id, amount]
    );

    // Link payment to appointment
    await client.query(
      'UPDATE appointments SET payment_id = $1 WHERE id = $2',
      [paymentResult.rows[0].id, appointment.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        appointment,
        paymentId: paymentResult.rows[0].id,
        amount
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create appointment' });
  } finally {
    client.release();
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
      return;
    }

    const result = await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Appointment not found' });
      return;
    }

    // If cancelled, update payment status too
    if (status === 'cancelled' && result.rows[0].payment_id) {
      await pool.query(
        "UPDATE payments SET status = 'refunded' WHERE id = $1 AND status = 'pending'",
        [result.rows[0].payment_id]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Appointment status updated',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { expert_id, date } = req.query;

    if (!expert_id || !date) {
      res.status(400).json({
        success: false,
        message: 'Expert ID and date are required'
      });
      return;
    }

    // Use date string directly to avoid timezone shifts
    const dateStr = (date as string).slice(0, 10); // YYYY-MM-DD
    const dateObj = new Date(dateStr + 'T12:00:00'); // noon to avoid DST edge
    const dayOfWeek = dateObj.getDay();

    // Get expert availability windows for the day
    const availabilityResult = await pool.query(
      `SELECT start_time, end_time, mode FROM expert_availability 
       WHERE expert_id = $1 AND day_of_week = $2`,
      [expert_id, dayOfWeek]
    );

    // Get booked slots for that date
    const bookedSlotsResult = await pool.query(
      `SELECT start_time, end_time FROM appointments
       WHERE expert_id = $1 
       AND DATE(start_time AT TIME ZONE 'Asia/Kolkata') = $2::date
       AND status NOT IN ('cancelled', 'no-show')
       ORDER BY start_time`,
      [expert_id, dateStr]
    );

    const bookedSlots = bookedSlotsResult.rows;
    const now = new Date();

    // Helper: check if a generated slot overlaps any booked appointment
    const isBooked = (slotStart: Date, slotEnd: Date): boolean => {
      return bookedSlots.some((b: any) => {
        const bs = new Date(b.start_time);
        const be = new Date(b.end_time);
        return slotStart < be && slotEnd > bs;
      });
    };

    // Generate 30-minute slots from each availability window
    const slots: any[] = [];

    for (const window of availabilityResult.rows) {
      // window.start_time / end_time come back as "HH:MM:SS" from PG TIME columns
      const [startH, startM] = (window.start_time as string).split(':').map(Number);
      const [endH, endM]     = (window.end_time   as string).split(':').map(Number);

      // Build Date objects for the window boundaries on the requested date
      const windowStart = new Date(`${dateStr}T${String(startH).padStart(2,'0')}:${String(startM).padStart(2,'0')}:00`);
      const windowEnd   = new Date(`${dateStr}T${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}:00`);

      let cursor = new Date(windowStart);

      while (cursor < windowEnd) {
        const slotStart = new Date(cursor);
        const slotEnd   = new Date(cursor.getTime() + 30 * 60 * 1000);

        if (slotEnd > windowEnd) break; // don't overflow the window

        const available = !isBooked(slotStart, slotEnd) && slotStart > now;

        const label = slotStart.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', hour12: true
        });

        slots.push({
          start_time: slotStart.toISOString(),
          end_time:   slotEnd.toISOString(),
          label,
          mode:      window.mode || 'online',
          available,
        });

        cursor = slotEnd;
      }
    }

    // Sort chronologically
    slots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    res.status(200).json({
      success: true,
      data: {
        slots,
        // Keep raw data for reference
        availability: availabilityResult.rows,
        bookedSlots,
      }
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available slots' });
  }
};

// ── Resend meet link SMS to patient ──────────────────────────────────────────
export const updateMeetLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { meet_link } = req.body;

    if (!meet_link) {
      res.status(400).json({ success: false, message: 'meet_link is required' });
      return;
    }

    // Update appointments table
    const result = await pool.query(
      'UPDATE appointments SET google_meet_link = $1 WHERE id = $2 AND mode = $3 RETURNING id',
      [meet_link, id, 'online']
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Online appointment not found' });
      return;
    }

    // Update google_meet_links table (delete existing + insert new)
    await pool.query('DELETE FROM google_meet_links WHERE appointment_id = $1', [id]);
    await pool.query(
      'INSERT INTO google_meet_links (appointment_id, meet_url) VALUES ($1, $2)',
      [id, meet_link]
    );

    res.status(200).json({ success: true, message: 'Meet link updated', data: { meet_link } });
  } catch (error: any) {
    console.error('updateMeetLink error:', error);
    res.status(500).json({ success: false, message: 'Failed to update meet link' });
  }
};


export const resendMeetLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.id, a.google_meet_link, a.start_time, a.mode,
              u.phone, u.full_name
       FROM appointments a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      res.status(404).json({ success: false, message: 'Appointment not found' }); return;
    }

    const appt = result.rows[0];

    if (appt.mode !== 'online') {
      res.status(400).json({ success: false, message: 'Not an online appointment' }); return;
    }
    if (!appt.google_meet_link) {
      res.status(400).json({ success: false, message: 'No meet link set for this appointment' }); return;
    }

    const apptDate = new Date(appt.start_time).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const apptTime = new Date(appt.start_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = `Hi ${appt.full_name || 'Patient'}, your online appointment on ${apptDate} at ${apptTime} — Join here: ${appt.google_meet_link} - Nila Healthcare`;

    await sendSMS(appt.phone, msg);

    await pool.query(
      `INSERT INTO notifications (user_id, type, channel, message)
       SELECT user_id, 'meet_link_resent', 'sms', $1 FROM appointments WHERE id = $2`,
      [msg, id]
    );

    res.json({ success: true, message: 'Meet link sent to patient via SMS' });
  } catch (error) {
    console.error('resendMeetLink error:', error);
    res.status(500).json({ success: false, message: 'Failed to send meet link' });
  }
};
