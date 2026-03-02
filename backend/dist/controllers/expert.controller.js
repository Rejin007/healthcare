"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExpert = exports.createExpert = exports.getExpertById = exports.getAllExperts = void 0;
const database_1 = __importDefault(require("../config/database"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getAllExperts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = `
      SELECT 
        e.id, e.bio, e.experience_years, e.profile_image, e.is_active,
        au.full_name, au.phone, au.email,
        COALESCE(COUNT(DISTINCT a.id), 0) as total_appointments
      FROM experts e
      LEFT JOIN admin_users au ON e.admin_user_id = au.id
      LEFT JOIN appointments a ON e.id = a.expert_id
      WHERE e.is_active = true
    `;
        const params = [];
        let paramCount = 1;
        if (search) {
            query += ` AND au.full_name ILIKE $${paramCount}`;
            params.push(`%${search}%`);
            paramCount++;
        }
        query += ` GROUP BY e.id, au.full_name, au.phone, au.email
               ORDER BY total_appointments DESC
               LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(Number(limit), offset);
        const result = await database_1.default.query(query, params);
        // Fixed: use proper count query with search filter
        let countQuery = 'SELECT COUNT(*) as total FROM experts e LEFT JOIN admin_users au ON e.admin_user_id = au.id WHERE e.is_active = true';
        const countParams = [];
        if (search) {
            countQuery += ` AND au.full_name ILIKE $1`;
            countParams.push(`%${search}%`);
        }
        const countResult = await database_1.default.query(countQuery, countParams);
        res.status(200).json({
            success: true,
            data: {
                experts: result.rows,
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
        console.error('Get experts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch experts' });
    }
};
exports.getAllExperts = getAllExperts;
const getExpertById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query(`SELECT e.id, e.bio, e.experience_years, e.profile_image, e.is_active,
              au.full_name, au.phone, au.email
       FROM experts e
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       WHERE e.id = $1`, [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Expert not found' });
            return;
        }
        const availabilityResult = await database_1.default.query('SELECT * FROM expert_availability WHERE expert_id = $1 ORDER BY day_of_week', [id]);
        const pricingResult = await database_1.default.query('SELECT * FROM expert_pricing WHERE expert_id = $1', [id]);
        res.status(200).json({
            success: true,
            data: {
                ...result.rows[0],
                availability: availabilityResult.rows,
                pricing: pricingResult.rows
            }
        });
    }
    catch (error) {
        console.error('Get expert error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch expert' });
    }
};
exports.getExpertById = getExpertById;
const createExpert = async (req, res) => {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        const { full_name, phone, email, password, bio, experience_years } = req.body;
        if (!full_name || !phone || !email || !password) {
            await client.query('ROLLBACK');
            res.status(400).json({ success: false, message: 'full_name, phone, email, and password are required' });
            return;
        }
        // Check if email already exists
        const existingUser = await client.query('SELECT id FROM admin_users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            res.status(400).json({ success: false, message: 'An admin user with this email already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const adminUserResult = await client.query(`INSERT INTO admin_users (full_name, phone, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name = 'expert'))
       RETURNING id`, [full_name, phone, email, hashedPassword]);
        const expertResult = await client.query(`INSERT INTO experts (admin_user_id, bio, experience_years)
       VALUES ($1, $2, $3) RETURNING id`, [adminUserResult.rows[0].id, bio || null, experience_years || null]);
        await client.query('COMMIT');
        res.status(201).json({
            success: true,
            message: 'Expert created successfully',
            data: { id: expertResult.rows[0].id }
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Create expert error:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, message: 'Expert with this phone or email already exists' });
        }
        else {
            res.status(500).json({ success: false, message: 'Failed to create expert' });
        }
    }
    finally {
        client.release();
    }
};
exports.createExpert = createExpert;
const updateExpert = async (req, res) => {
    try {
        const { id } = req.params;
        const { bio, experience_years, is_active } = req.body;
        const result = await database_1.default.query(`UPDATE experts 
       SET bio = COALESCE($1, bio),
           experience_years = COALESCE($2, experience_years),
           is_active = COALESCE($3, is_active)
       WHERE id = $4
       RETURNING *`, [bio, experience_years, is_active, id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Expert not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Expert updated successfully',
            data: result.rows[0]
        });
    }
    catch (error) {
        console.error('Update expert error:', error);
        res.status(500).json({ success: false, message: 'Failed to update expert' });
    }
};
exports.updateExpert = updateExpert;
//# sourceMappingURL=expert.controller.js.map