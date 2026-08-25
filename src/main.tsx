import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';

function App() {
  return <main>
    <header><div className="brand"><strong>GTA</strong><span>WALL</span></div><a href="#dealers">Dealer Access</a></header>
    <section className="hero">
      <div className="badge">GOING TO AUCTION</div>
      <h1>Buy it before<br/><em>the auction does.</em></h1>
      <p>GTA Wall gives buyers a last look at dealer vehicles headed to auction. Dealers get one more chance to sell. Buyers get one more chance to save.</p>
      <div className="actions"><a className="primary" href="#wall">Browse the Wall</a><a className="secondary" href="#dealers">List a Vehicle</a></div>
    </section>
    <section id="wall" className="strip"><b>5 DAYS.</b><span>One last opportunity before the vehicle goes to auction.</span><b>THEN IT'S GONE.</b></section>
    <section className="cards">
      <article><small>01</small><h2>Dealers Post</h2><p>Vehicles scheduled for auction get a final public showcase.</p></article>
      <article><small>02</small><h2>Buyers Discover</h2><p>Browse pre-auction cars, trucks and SUVs before they leave the lot.</p></article>
      <article><small>03</small><h2>Make a Deal</h2><p>Connect before the countdown expires and the vehicle heads to auction.</p></article>
    </section>
    <section id="dealers" className="dealer"><h2>Have inventory going to auction?</h2><p>Put it on the GTA Wall first. Turn wholesale-bound inventory into one more retail opportunity.</p><a className="primary" href="mailto:info@gtawall.com">Dealer Inquiry</a></section>
    <footer>GTA WALL · GOING TO AUCTION · gtawall.com</footer>
  </main>
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
