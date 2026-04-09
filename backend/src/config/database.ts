import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ── Detect environment ────────────────────────────────────────────────────────
const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
const dbUrl    = process.env.DATABASE_URL;

// ── Build pool config ─────────────────────────────────────────────────────────
const poolConfig = dbUrl
  ? {
      connectionString: dbUrl,
      // SSL required for Render / cloud Postgres; skip for localhost
      ssl: isRender ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis:       30000,
      max: 10,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME     || 'nila_healthcare',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis:       30000,
      max: 10,
    };

const pool = new Pool(poolConfig as any);

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message);
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT current_database() as db, now() as time');
    console.log(` PostgreSQL connected → ${res.rows[0].db}`);
    client.release();
  } catch (error: any) {
    console.error(' DB connection failed:', error.message);
    console.log('   Server starting anyway. Check DATABASE_URL or local Postgres.');
  }
};

export { pool };
export default pool;