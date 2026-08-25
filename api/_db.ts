import { Pool } from 'pg';
import crypto from 'node:crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined });

export async function query(text: string, params: unknown[] = []) { return pool.query(text, params); }
export function dealerKey() { return crypto.randomBytes(24).toString('hex'); }
export function hashKey(key: string) { return crypto.createHash('sha256').update(key).digest('hex'); }
export function premiumActive(d: any) { return d.plan === 'premium' && (!d.premium_until || new Date(d.premium_until) > new Date()); }
export function vehicleLimit(d: any) { return premiumActive(d) ? 5 : 3; }

export async function dealerFromRequest(req: any) {
  const key = String(req.headers['x-dealer-key'] || '');
  if (!key) return null;
  const r = await query('select * from dealers where api_key_hash=$1 limit 1', [hashKey(key)]);
  return r.rows[0] || null;
}
