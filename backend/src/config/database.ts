import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool(
  process.env.DATABASE_URL
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
      }
);

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    console.log(' PostgreSQL connected successfully');
    client.release();
  } catch (error) {
    console.error(' PostgreSQL connection error:', error);
    throw error;
  }
};

export { pool };
export default pool;