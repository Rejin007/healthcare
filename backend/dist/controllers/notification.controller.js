"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = exports.markAllRead = exports.markNotificationRead = exports.getAllNotifications = void 0;
const database_1 = __importDefault(require("../config/database"));
const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 50, filter } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = `
      SELECT 
        n.id, n.type, n.channel, n.message, n.read_at, n.created_at,
        u.full_name as user_name, u.phone as user_phone
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;
        if (filter === 'unread') {
            query += ` AND n.read_at IS NULL`;
        }
        else if (filter === 'read') {
            query += ` AND n.read_at IS NOT NULL`;
        }
        query += ` ORDER BY n.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(Number(limit), offset);
        const result = await database_1.default.query(query, params);
        res.status(200).json({
            success: true,
            data: result.rows
        });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};
exports.getAllNotifications = getAllNotifications;
const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await database_1.default.query('UPDATE notifications SET read_at = NOW() WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            res.status(404).json({ success: false, message: 'Notification not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Notification marked as read', data: result.rows[0] });
    }
    catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
};
exports.markNotificationRead = markNotificationRead;
const markAllRead = async (req, res) => {
    try {
        await database_1.default.query('UPDATE notifications SET read_at = NOW() WHERE read_at IS NULL');
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
};
exports.markAllRead = markAllRead;
const createNotification = async (req, res) => {
    try {
        const { user_id, type, channel, message } = req.body;
        if (!message) {
            res.status(400).json({ success: false, message: 'Message is required' });
            return;
        }
        const result = await database_1.default.query(`INSERT INTO notifications (user_id, type, channel, message)
       VALUES ($1, $2, $3, $4) RETURNING *`, [user_id || null, type || 'info', channel || 'system', message]);
        res.status(201).json({ success: true, data: result.rows[0] });
    }
    catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to create notification' });
    }
};
exports.createNotification = createNotification;
//# sourceMappingURL=notification.controller.js.map