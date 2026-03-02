"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.connectDatabase = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool(process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false,
        },
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'nila_healthcare',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    });
exports.pool = pool;
const connectDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log(' PostgreSQL connected successfully');
        client.release();
    }
    catch (error) {
        console.error(' PostgreSQL connection error:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
exports.default = pool;
//# sourceMappingURL=database.js.map