import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'nila_healthcare',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        connectionTimeoutMillis: 10000,
      }
);

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log('PostgreSQL connected successfully');
    client.release();
  } catch (error: any) {
    // Don't throw — let server start anyway
    console.error(' DB connection failed:', error.message);
    console.log('   Server starting anyway. Check DATABASE_URL or firewall.');
  }
};

export { pool };
export default pool;