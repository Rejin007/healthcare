"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, message: 'Access token required' });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({ success: false, message: 'Invalid or expired token' });
        return;
    }
};
exports.authenticateToken = authenticateToken;
const authorizeRoles = (...roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        // If specific roles needed, check role_id here
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
//# sourceMappingURL=auth.middleware.js.map