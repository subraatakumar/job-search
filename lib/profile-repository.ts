import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export type ProfileInput = {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  countries: string;
  skills: string;
  source: string;
};

async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS profiles (user_id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', headline TEXT NOT NULL DEFAULT '', target_countries TEXT NOT NULL DEFAULT '', skills TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'manual', confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
}

export async function getProfile(userId: string) {
  await ensureTable();
  const result = await pool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  return result.rows[0] ?? null;
}

export async function saveProfile(userId: string, profile: ProfileInput) {
  await ensureTable();
  const result = await pool.query(`INSERT INTO profiles (user_id, name, email, phone, location, headline, target_countries, skills, source) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (user_id) DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone, location=EXCLUDED.location, headline=EXCLUDED.headline, target_countries=EXCLUDED.target_countries, skills=EXCLUDED.skills, source=EXCLUDED.source, updated_at=NOW() RETURNING *`, [userId, profile.name, profile.email, profile.phone, profile.location, profile.headline, profile.countries, profile.skills, profile.source]);
  return result.rows[0];
}
