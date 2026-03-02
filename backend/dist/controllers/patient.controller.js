"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientStats = exports.deletePatient = exports.updatePatient = exports.createPatient = exports.getPatientById = exports.getAllPatients = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllPatients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = `
      SELECT id, phone, email, full_name, is_active, created_at, last_login_at
      FROM users
      WHERE is_active = true
    `;
        const params = [];
        let paramCount = 1;
        if (search) {
            query += ` AND (full_name ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }
        query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(Number(limit), offset);
        const result = await database_1.default.query(query, params);
        // Fixed: count query respects search filter
        let countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
        const countParams = [];
        if (search) {
            countQuery += ` AND (full_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)`;
            countParams.push(`%${search}%`);
        }
        const countResult = await database_1.default.query(countQuery, countParams);
        res.status(200).json({
            success: true,
            data: {
                patients: result.rows,
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
        console.error('Get patients error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch patients' });
    }
};
exports.getAllPatients = getAllPatients;
const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('SELECT id, phone, email, full_name, is_active, created_at, last_login_at FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Patient not found' });
            return;
        }
        // Get patient's recent appointments
        const appointmentsResult = await database_1.default.query(`SELECT a.id, a.mode, a.status, a.start_time, a.end_time, a.created_at,
              au.full_name as expert_name
       FROM appointments a
       LEFT JOIN experts e ON a.expert_id = e.id
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       WHERE a.user_id = $1
       ORDER BY a.start_time DESC
       LIMIT 10`, [id]);
        res.status(200).json({
            success: true,
            data: {
                patient: result.rows[0],
                appointments: appointmentsResult.rows
            }
        });
    }
    catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch patient' });
    }
};
exports.getPatientById = getPatientById;
const createPatient = async (req, res) => {
    try {
        const { phone, email, full_name } = req.body;
        if (!phone) {
            res.status(400).json({ success: false, message: 'Phone number is required' });
            return;
        }
        // Validate phone format (basic)
        const cleanPhone = phone.replace(/\s/g, '');
        if (cleanPhone.length < 10) {
            res.status(400).json({ success: false, message: 'Please enter a valid phone number' });
            return;
        }
        // Check if patient exists
        const existingPatient = await database_1.default.query('SELECT id FROM users WHERE phone = $1', [cleanPhone]);
        if (existingPatient.rows.length > 0) {
            res.status(409).json({ success: false, message: 'A patient with this phone number already exists' });
            return;
        }
        const result = await database_1.default.query(`INSERT INTO users (phone, email, full_name, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, phone, email, full_name, created_at`, [cleanPhone, email || null, full_name || null]);
        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Create patient error:', error);
        if (error.code === '23505') {
            res.status(409).json({ success: false, message: 'A patient with this phone number already exists' });
        }
        else {
            res.status(500).json({ success: false, message: 'Failed to create patient' });
        }
    }
};
exports.createPatient = createPatient;
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, full_name, is_active } = req.body;
        const result = await database_1.default.query(`UPDATE users 
       SET email = COALESCE($1, email),
           full_name = COALESCE($2, full_name),
           is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING id, phone, email, full_name, is_active`, [email, full_name, is_active, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Patient not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Patient updated successfully',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({ success: false, message: 'Failed to update patient' });
    }
};
exports.updatePatient = updatePatient;
const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('UPDATE users SET is_active = false WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Patient not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Patient deactivated successfully'
        });
    }
    catch (error) {
        console.error('Delete patient error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete patient' });
    }
};
exports.deletePatient = deletePatient;
const getPatientStats = async (req, res) => {
    try {
        const stats = await database_1.default.query(`
      SELECT 
        COUNT(*) as total_patients,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_this_month,
        COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days') as active_this_week
      FROM users
      WHERE is_active = true
    `);
        res.status(200).json({
            success: true,
            data: {
                total_patients: parseInt(stats.rows[0].total_patients),
                new_this_month: parseInt(stats.rows[0].new_this_month),
                active_this_week: parseInt(stats.rows[0].active_this_week)
            }
        });
    }
    catch (error) {
        console.error('Get patient stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};
exports.getPatientStats = getPatientStats;
//# sourceMappingURL=patient.controller.js.map