import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dealerKey, hashKey, query } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const { name, email, phone, address, websiteUrl, latitude, longitude } = req.body || {};
  if (!name || !email || !address) return res.status(400).json({ error: 'Name, email and address are required' });
  if (latitude == null || longitude == null) return res.status(400).json({ error: 'Dealer location is required for geo filtering' });
  const key = dealerKey();
  try {
    const r = await query(`insert into dealers(name,email,phone,address,website_url,latitude,longitude,plan,api_key_hash)
      values($1,$2,$3,$4,$5,$6,$7,'free',$8) returning id,name,email,plan`,
      [name, String(email).toLowerCase(), phone || null, address, websiteUrl || null, latitude, longitude, hashKey(key)]);
    return res.status(201).json({ dealer: r.rows[0], dealerKey: key, vehicleLimit: 3 });
  } catch (e: any) {
    if (e?.code === '23505') return res.status(409).json({ error: 'A dealer account already exists for this email' });
    console.error(e); return res.status(500).json({ error: 'Unable to create dealer' });
  }
}
