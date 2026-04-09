import { Request, Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

// ─── helpers ────────────────────────────────────────────────────────────────

async function getSpecializationNames(expertId: string): Promise<string[]> {
  const res = await pool.query(
    `SELECT s.name FROM specializations s
     JOIN expert_specializations es ON es.specialization_id = s.id
     WHERE es.expert_id = $1 ORDER BY s.name`,
    [expertId]
  );
  return res.rows.map((r: any) => r.name);
}

async function getPricing(expertId: string): Promise<{ mode: string; price: number }[]> {
  const res = await pool.query(
    'SELECT mode, price FROM expert_pricing WHERE expert_id = $1',
    [expertId]
  );
  return res.rows;
}

async function saveSpecializations(client: any, expertId: string, specializations: any) {
  const specs: string[] = Array.isArray(specializations) ? specializations : [];
  await client.query('DELETE FROM expert_specializations WHERE expert_id = $1', [expertId]);
  for (const name of specs) {
    if (!name || typeof name !== 'string') continue;
    let res = await client.query('SELECT id FROM specializations WHERE name = $1', [name.trim()]);
    if (res.rows.length === 0) {
      res = await client.query('INSERT INTO specializations (name) VALUES ($1) RETURNING id', [name.trim()]);
    }
    await client.query(
      'INSERT INTO expert_specializations (expert_id, specialization_id) VALUES ($1, $2)',
      [expertId, res.rows[0].id]
    );
  }
}

async function savePricing(client: any, expertId: string, onlinePrice: any, inpersonPrice: any) {
  await client.query('DELETE FROM expert_pricing WHERE expert_id = $1', [expertId]);
  const online = onlinePrice !== null && onlinePrice !== undefined && onlinePrice !== '' ? Number(onlinePrice) : null;
  const inperson = inpersonPrice !== null && inpersonPrice !== undefined && inpersonPrice !== '' ? Number(inpersonPrice) : null;
  if (online !== null && !isNaN(online)) {
    await client.query(
      'INSERT INTO expert_pricing (expert_id, mode, price, currency) VALUES ($1, $2, $3, $4)',
      [expertId, 'online', online, 'INR']
    );
  }
  if (inperson !== null && !isNaN(inperson)) {
    await client.query(
      'INSERT INTO expert_pricing (expert_id, mode, price, currency) VALUES ($1, $2, $3, $4)',
      [expertId, 'inperson', inperson, 'INR']
    );
  }
}

async function saveAvailability(client: any, expertId: string, availability: any) {
  const slots = Array.isArray(availability) ? availability : [];
  await client.query('DELETE FROM expert_availability WHERE expert_id = $1', [expertId]);
  for (const slot of slots) {
    const { day_of_week, start_time, end_time, mode } = slot;
    if (day_of_week === undefined || !start_time || !end_time) continue;
    await client.query(
      'INSERT INTO expert_availability (expert_id, day_of_week, start_time, end_time, mode) VALUES ($1, $2, $3, $4, $5)',
      [expertId, Number(day_of_week), start_time, end_time, mode || 'online']
    );
  }
}

// ─── GET ALL ─────────────────────────────────────────────────────────────────

export const getAllExperts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT
        e.id, e.bio, e.experience_years, e.profile_image, e.is_active,
        au.full_name, au.phone, au.email,
        COALESCE((SELECT COUNT(*) FROM appointments a WHERE a.expert_id = e.id), 0) AS total_appointments
      FROM experts e
      LEFT JOIN admin_users au ON e.admin_user_id = au.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let p = 1;

    if (search) {
      query += ` AND au.full_name ILIKE $${p}`;
      params.push(`%${search}%`);
      p++;
    }

    query += ` ORDER BY total_appointments DESC LIMIT $${p} OFFSET $${p + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Attach specializations, pricing, availability per expert
    // Also flatten online_price / inperson_price for the booking list UI
    const experts = await Promise.all(result.rows.map(async (expert: any) => {
      const pricing     = await getPricing(expert.id);
      const availResult = await pool.query(
        'SELECT day_of_week, start_time, end_time, mode FROM expert_availability WHERE expert_id = $1 ORDER BY day_of_week',
        [expert.id]
      );
      const online_price   = pricing.find((p: any) => p.mode === 'online')?.price   ?? null;
      const inperson_price = pricing.find((p: any) => p.mode === 'inperson')?.price ?? null;
      return {
        ...expert,
        specializations: await getSpecializationNames(expert.id),
        pricing,
        availability: availResult.rows,
        online_price,
        inperson_price,
      };
    }));

    let countQuery = `SELECT COUNT(*) AS total FROM experts e LEFT JOIN admin_users au ON e.admin_user_id = au.id WHERE 1=1`;
    const countParams: any[] = [];
    if (search) {
      countQuery += ` AND au.full_name ILIKE $1`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);

    res.status(200).json({
      success: true,
      data: {
        experts,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(parseInt(countResult.rows[0].total) / Number(limit)),
          totalItems: parseInt(countResult.rows[0].total),
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('getAllExperts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch experts' });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────

export const getExpertById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT e.id, e.bio, e.experience_years, e.profile_image, e.is_active,
              au.full_name, au.phone, au.email
       FROM experts e
       LEFT JOIN admin_users au ON e.admin_user_id = au.id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Expert not found' });
      return;
    }

    const availability = await pool.query(
      'SELECT * FROM expert_availability WHERE expert_id = $1 ORDER BY day_of_week',
      [id]
    );

    const pricing = await getPricing(id);
    const online_price   = pricing.find((p: any) => p.mode === 'online')?.price   ?? null;
    const inperson_price = pricing.find((p: any) => p.mode === 'inperson')?.price ?? null;

    res.status(200).json({
      success: true,
      data: {
        ...result.rows[0],
        specializations: await getSpecializationNames(id),
        pricing,
        availability: availability.rows,
        online_price,
        inperson_price,
      }
    });
  } catch (error) {
    console.error('getExpertById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expert' });
  }
};

// ─── CREATE ───────────────────────────────────────────────────────────────────

export const createExpert = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { full_name, phone, email, password, bio, experience_years,
            profile_image, specializations, online_price, inperson_price,
            availability } = req.body;

    console.log('[createExpert] body:', JSON.stringify({
      full_name, profile_image, specializations, online_price, inperson_price
    }));

    if (!full_name || !phone || !email || !password) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'full_name, phone, email, and password are required' });
      return;
    }

    const existing = await client.query('SELECT id FROM admin_users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ success: false, message: 'An admin user with this email already exists' });
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    const adminRes = await client.query(
      `INSERT INTO admin_users (full_name, phone, email, password_hash, role_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name = 'expert'))
       RETURNING id`,
      [full_name, phone, email, hash]
    );

    const expertRes = await client.query(
      `INSERT INTO experts (admin_user_id, bio, experience_years, profile_image)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [
        adminRes.rows[0].id,
        bio || null,
        experience_years != null && experience_years !== '' ? Number(experience_years) : null,
        profile_image || null
      ]
    );

    const expertId = expertRes.rows[0].id;

    await saveSpecializations(client, expertId, specializations);
    await savePricing(client, expertId, online_price, inperson_price);
    await saveAvailability(client, expertId, availability);

    await client.query('COMMIT');

    console.log('[createExpert] success, expertId:', expertId);

    res.status(201).json({
      success: true,
      message: 'Expert created successfully',
      data: { id: expertId }
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[createExpert] error:', error);
    if (error.code === '23505') {
      res.status(400).json({ success: false, message: 'Expert with this phone or email already exists' });
    } else {
      res.status(500).json({ success: false, message: `Failed to create expert: ${error.message}` });
    }
  } finally {
    client.release();
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export const updateExpert = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { bio, experience_years, is_active, profile_image,
            specializations, online_price, inperson_price, availability } = req.body;

    console.log('[updateExpert] id:', id, 'body:', JSON.stringify({
      profile_image, specializations, online_price, inperson_price
    }));

    const result = await client.query(
      `UPDATE experts
       SET bio              = CASE WHEN $1::text IS NOT NULL AND $1 <> '' THEN $1 ELSE bio END,
           experience_years = CASE WHEN $2::int  IS NOT NULL              THEN $2 ELSE experience_years END,
           is_active        = CASE WHEN $3::bool IS NOT NULL              THEN $3 ELSE is_active END,
           profile_image    = CASE WHEN $4::text IS NOT NULL AND $4 <> '' THEN $4 ELSE profile_image END
       WHERE id = $5
       RETURNING *`,
      [
        bio ?? null,
        experience_years != null && experience_years !== '' ? Number(experience_years) : null,
        is_active ?? null,
        profile_image ?? null,
        id
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Expert not found' });
      return;
    }

    // Always update specializations and pricing when keys present in body
    if ('specializations' in req.body) {
      await saveSpecializations(client, id, specializations);
    }
    if ('online_price' in req.body || 'inperson_price' in req.body) {
      await savePricing(client, id, online_price, inperson_price);
    }
    if ('availability' in req.body) {
      await saveAvailability(client, id, availability);
    }

    await client.query('COMMIT');

    console.log('[updateExpert] success, id:', id);

    res.status(200).json({
      success: true,
      message: 'Expert updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('[updateExpert] error:', error);
    res.status(500).json({ success: false, message: `Failed to update expert: ${error.message}` });
  } finally {
    client.release();
  }
};
