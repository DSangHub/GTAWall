import React,{useState} from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

function App(){
 const [radius,setRadius]=useState(50);const [status,setStatus]=useState('');
 const nearby=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(async p=>{setStatus('Finding vehicles near you…');const r=await fetch(`/api/vehicles?lat=${p.coords.latitude}&lng=${p.coords.longitude}&radius=${radius}`);const v=await r.json();setStatus(`${v.length} active vehicle${v.length===1?'':'s'} found within ${radius} miles.`)},()=>setStatus('Location permission was not granted.')):setStatus('Geolocation is not supported by this browser.');
 return <main>
  <header><div className="brand"><strong>GTA</strong><span>WALL</span></div><a href="#dealers">Dealer Signup</a></header>
  <section className="hero"><div className="badge">GOING TO AUCTION</div><h1>Buy it before<br/><em>the auction does.</em></h1><p>GTA Wall gives buyers a last look at dealer vehicles headed to auction. Dealers get one more chance to sell. Buyers get one more chance to save.</p><div className="actions"><a className="primary" href="#wall">Browse the Wall</a><a className="secondary" href="#dealers">List a Vehicle</a></div></section>
  <section id="wall" className="strip"><b>SHOP LOCAL.</b><span>Find pre-auction vehicles close to you.</span><select value={radius} onChange={e=>setRadius(Number(e.target.value))}><option value="25">25 miles</option><option value="50">50 miles</option><option value="100">100 miles</option><option value="250">250 miles</option></select><button onClick={nearby}>Use My Location</button><span>{status}</span></section>
  <section className="cards"><article><small>FREE</small><h2>Dealer Starter</h2><p>Create a dealer account and display up to <b>3 active vehicles</b> at no charge.</p></article><article><small>$50 / MONTH</small><h2>Premium Dealer</h2><p>Display up to <b>5 active vehicles</b> plus a <b>one-click link</b> from your listings to your dealership website.</p></article><article><small>LOCAL</small><h2>Geo Discovery</h2><p>Buyers can filter active inventory by distance using their current location.</p></article></section>
  <section id="dealers" className="dealer"><h2>Dealer Signup</h2><p><b>Start free.</b> List up to 3 vehicles going to auction. Upgrade to Premium for $50/month when you want 5 listings and direct traffic to your dealership URL.</p><p>The backend now supports dealer registration, vehicle limits, geolocation and Stripe Premium billing.</p></section>
  <footer>GTA WALL · GOING TO AUCTION · gtawall.com</footer>
 </main>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
