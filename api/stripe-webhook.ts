import type { VercelRequest,VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { query } from './_db.js';
const stripe=new Stripe(process.env.STRIPE_SECRET_KEY||'');
export const config={api:{bodyParser:false}};
async function raw(req:any){const chunks=[];for await(const c of req)chunks.push(c);return Buffer.concat(chunks)}
export default async function handler(req:VercelRequest,res:VercelResponse){
 if(req.method!=='POST')return res.status(405).end();
 try{
  const body=await raw(req);const sig=String(req.headers['stripe-signature']||'');
  const event=stripe.webhooks.constructEvent(body,sig,process.env.STRIPE_WEBHOOK_SECRET||'');
  if(event.type==='checkout.session.completed'){
   const s=event.data.object as Stripe.Checkout.Session;const dealerId=Number(s.metadata?.dealerId);
   if(dealerId) await query(`update dealers set plan='premium',stripe_customer_id=$1,stripe_subscription_id=$2,premium_until=now()+interval '1 month' where id=$3`,[String(s.customer||''),String(s.subscription||''),dealerId]);
  }
  if(event.type==='customer.subscription.deleted'){
   const s=event.data.object as Stripe.Subscription;await query(`update dealers set plan='free',premium_until=now(),stripe_subscription_id=null where stripe_subscription_id=$1`,[s.id]);
  }
  return res.json({received:true});
 }catch(e:any){console.error(e);return res.status(400).send(`Webhook Error: ${e.message}`)}
}
