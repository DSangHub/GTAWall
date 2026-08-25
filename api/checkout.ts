import type { VercelRequest,VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { dealerFromRequest } from './_db.js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='POST') return res.status(405).json({error:'POST required'});
 const d=await dealerFromRequest(req); if(!d) return res.status(401).json({error:'Invalid dealer key'});
 if(!process.env.STRIPE_SECRET_KEY) return res.status(503).json({error:'Stripe is not configured'});
 const origin=`https://${req.headers.host}`;
 const session=await stripe.checkout.sessions.create({mode:'subscription',customer_email:d.email,line_items:[{price_data:{currency:'usd',unit_amount:5000,recurring:{interval:'month'},product_data:{name:'GTA Wall Premium',description:'Display up to 5 active vehicles and add a one-click dealer website link.'}},quantity:1}],metadata:{dealerId:String(d.id)},success_url:`${origin}/?premium=success`,cancel_url:`${origin}/?premium=cancelled`});
 return res.json({url:session.url});
}
