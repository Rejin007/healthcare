"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableSlots = exports.updateAppointmentStatus = exports.createAppointment = exports.getAppointmentById = exports.getAllAppointments = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllAppointments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, expert_id, user_id, date } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = `
      SELECT 
        a.id, a.start_time, a.end_time, a.mode, a.status, a.created_at,
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
        const params = [];
        let paramCount = 1;
        if (status) {
            query += ` AND a.status = $${paramCount}`;
            params.push(status);
            paramCount++;
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
        const result = await database_1.default.query(query, params);
        // Fixed: count query should respect filters
        let countQuery = `
      SELECT COUNT(*) as total 
      FROM appointments a
      WHERE 1=1
    `;
        const countParams = [];
        let countParamCount = 1;
        if (status) {
            countQuery += ` AND a.status = $${countParamCount}`;
            countParams.push(status);
            countParamCount++;
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
        const countResult = await database_1.default.query(countQuery, countParams);
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
    }
    catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
    }
};
exports.getAllAppointments = getAllAppointments;
const getAppointmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query(`SELECT 
        a.id, a.mode, a.status, a.start_time, a.end_time, a.google_meet_link, a.created_at,
        u.full_name as patient_name, u.phone as patient_phone, u.email as patient_email,
        au.full_name as expert_name, au.phone as expert_phone,
        p.amount, p.status as payment_status, p.razorpay_payment_id
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       LEFT JOIN payments p ON a.payment_id = p.id
       WHERE a.id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Appointment not found' });
            return;
        }
        res.status(200).json({ success: true, data: result.rows[0] });
    }
    catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch appointment' });
    }
};
exports.getAppointmentById = getAppointmentById;
const createAppointment = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        const { user_id, expert_id, mode, start_time, duration = 30 } = req.body;
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
        // Check for scheduling conflicts
        const conflictCheck = await client.query(`SELECT id FROM appointments
       WHERE expert_id = $1 
       AND status NOT IN ('cancelled', 'no-show')
       AND (
         (start_time <= $2 AND end_time > $2) OR
         (start_time < $3 AND end_time >= $3) OR
         (start_time >= $2 AND end_time <= $3)
       )`, [expert_id, startTime, endTime]);
        if (conflictCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(409).json({
                success: false,
                message: 'This time slot is already booked'
            });
            return;
        }
        // Get pricing
        const pricingResult = await client.query('SELECT price FROM expert_pricing WHERE expert_id = $1 AND mode = $2', [expert_id, mode]);
        const amount = pricingResult.rows.length > 0 ? pricingResult.rows[0].price : 500;
        // Create appointment
        const appointmentResult = await client.query(`INSERT INTO appointments (
        user_id, expert_id, mode, start_time, end_time, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, 'scheduled', $6)
      RETURNING *`, [user_id, expert_id, mode, startTime, endTime, req.user?.type || 'admin']);
        const appointment = appointmentResult.rows[0];
        // Create payment record
        const paymentResult = await client.query(`INSERT INTO payments (
        user_id, appointment_id, amount, currency, status
      ) VALUES ($1, $2, $3, 'INR', 'pending')
      RETURNING id`, [user_id, appointment.id, amount]);
        // Link payment to appointment
        await client.query('UPDATE appointments SET payment_id = $1 WHERE id = $2', [paymentResult.rows[0].id, appointment.id]);
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Create appointment error:', error);
        res.status(500).json({ success: false, message: 'Failed to create appointment' });
    }
    finally {
        client.release();
    }
};
exports.createAppointment = createAppointment;
const updateAppointmentStatus = async (req, res) => {
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
        const result = await database_1.default.query('UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Appointment not found' });
            return;
        }
        // If cancelled, update payment status too
        if (status === 'cancelled' && result.rows[0].payment_id) {
            await database_1.default.query("UPDATE payments SET status = 'refunded' WHERE id = $1 AND status = 'pending'", [result.rows[0].payment_id]);
        }
        res.status(200).json({
            success: true,
            message: 'Appointment status updated',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Update appointment status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
};
exports.updateAppointmentStatus = updateAppointmentStatus;
const getAvailableSlots = async (req, res) => {
    try {
        const { expert_id, date } = req.query;
        if (!expert_id || !date) {
            res.status(400).json({
                success: false,
                message: 'Expert ID and date are required'
            });
            return;
        }
        const dateObj = new Date(date);
        const dayOfWeek = dateObj.getDay();
        // Get expert availability
        const availabilityResult = await database_1.default.query(`SELECT start_time, end_time, mode FROM expert_availability 
       WHERE expert_id = $1 AND day_of_week = $2`, [expert_id, dayOfWeek]);
        // Get booked slots
        const bookedSlotsResult = await database_1.default.query(`SELECT start_time, end_time FROM appointments
       WHERE expert_id = $1 
       AND DATE(start_time) = $2 
       AND status NOT IN ('cancelled', 'no-show')
       ORDER BY start_time`, [expert_id, date]);
        res.status(200).json({
            success: true,
            data: {
                availability: availabilityResult.rows,
                bookedSlots: bookedSlotsResult.rows
            }
        });
    }
    catch (error) {
        console.error('Get available slots error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch available slots' });
    }
};
exports.getAvailableSlots = getAvailableSlots;
//# sourceMappingURL=appointment.controller.js.map