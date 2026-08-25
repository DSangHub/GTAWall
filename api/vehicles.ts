import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dealerFromRequest, premiumActive, query, vehicleLimit } from './_db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const lat = Number(req.query.lat), lng = Number(req.query.lng), radius = Math.min(Number(req.query.radius || 100), 500);
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
    const geo = `3959 * acos(least(1, cos(radians($1))*cos(radians(d.latitude))*cos(radians(d.longitude)-radians($2))+sin(radians($1))*sin(radians(d.latitude))))`;
    const sql = hasGeo
      ? `select v.*,d.name dealer_name,case when d.plan='premium' and (d.premium_until is null or d.premium_until>now()) then d.website_url else null end dealer_url, ${geo} distance_miles from vehicles v join dealers d on d.id=v.dealer_id where v.active=true and v.auction_deadline>now() and ${geo} <= $3 order by distance_miles,v.created_at desc`
      : `select v.*,d.name dealer_name,case when d.plan='premium' and (d.premium_until is null or d.premium_until>now()) then d.website_url else null end dealer_url,null::float distance_miles from vehicles v join dealers d on d.id=v.dealer_id where v.active=true and v.auction_deadline>now() order by v.created_at desc`;
    const r = await query(sql, hasGeo ? [lat,lng,radius] : []); return res.json(r.rows);
  }
  if (req.method === 'POST') {
    const dealer = await dealerFromRequest(req); if (!dealer) return res.status(401).json({ error: 'Invalid dealer key' });
    const c = await query('select count(*)::int n from vehicles where dealer_id=$1 and active=true and auction_deadline>now()', [dealer.id]);
    const limit = vehicleLimit(dealer); if (c.rows[0].n >= limit) return res.status(403).json({ error: `Your ${premiumActive(dealer)?'Premium':'Free'} plan allows ${limit} active vehicles` });
    const { title, price, year, make, model, mileage, imageUrl, auctionDeadline } = req.body || {};
    if (!title || !price || !auctionDeadline) return res.status(400).json({ error: 'Title, price and auction deadline are required' });
    const r = await query(`insert into vehicles(dealer_id,title,price,year,make,model,mileage,image_url,auction_deadline) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *`, [dealer.id,title,price,year||null,make||null,model||null,mileage||null,imageUrl||null,new Date(auctionDeadline)]);
    return res.status(201).json({ vehicle:r.rows[0], activeCount:c.rows[0].n+1, limit });
  }
  return res.status(405).json({ error: 'GET or POST required' });
}
