const features = [
  { number: "01", title: "Create your raffle", text: "Set the prize, choose your ticket total, and make a campaign that feels like yours." },
  { number: "02", title: "Bring people in", text: "Share a simple entry page and watch your community get excited together." },
  { number: "03", title: "Pick a winner", text: "Run a transparent draw and celebrate the person taking home the prize." },
]

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="RafflePro home"><span className="brand-mark">R</span> rafflepro</a>
        <nav aria-label="Main navigation"><a href="#how-it-works">How it works</a><a className="nav-cta" href="mailto:hello@rafflepro.com">Get started <span aria-hidden="true">↗</span></a></nav>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> THE BETTER WAY TO GIVE</p>
          <h1>Good things<br />happen <em>by chance.</em></h1>
          <p className="hero-description">Bring people together around something worth winning. RafflePro makes every draw feel fair, simple, and a little more exciting.</p>
          <a className="primary-cta" href="mailto:hello@rafflepro.com">Start a raffle <span aria-hidden="true">↗</span></a>
          <p className="trust-note"><span className="trust-dot" aria-hidden="true" /> Simple to set up. Easy to trust.</p>
        </div>
        <div className="raffle-card" aria-label="Example raffle card">
          <div className="card-topline"><span>COMMUNITY DRAW · NO. 024</span><span className="status-pill">LIVE NOW</span></div>
          <div className="ticket-art"><div className="sunburst" aria-hidden="true"><span>GOOD<br />LUCK</span></div><div className="ticket-copy"><span>THE GRAND PRIZE</span><strong>A little<br />something<br /><i>special.</i></strong></div><div className="ticket-number">#024</div></div>
          <div className="card-bottom"><div><span className="muted-label">TICKETS CLAIMED</span><strong>1,284 <small>/ 2,000</small></strong></div><div className="progress-track"><span /></div><div className="draw-date"><span className="muted-label">DRAWING</span><strong>Friday, 8pm</strong></div></div>
        </div>
        <div className="hero-index">01 <span /> MADE FOR MOMENTS THAT MATTER</div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="section-heading"><p className="eyebrow">A LITTLE LUCK. A LOT OF HEART.</p><h2>Make a moment<br />out of the <em>ordinary.</em></h2></div>
        <div className="feature-list">{features.map((feature) => <article className="feature" key={feature.number}><span className="feature-number">{feature.number}</span><div><h3>{feature.title}</h3><p>{feature.text}</p></div><span className="feature-arrow" aria-hidden="true">↗</span></article>)}</div>
      </section>
      <footer><a className="brand" href="/" aria-label="RafflePro home"><span className="brand-mark">R</span> rafflepro</a><span>Make good things happen.</span><span>© 2026 RafflePro</span></footer>
    </main>
  )
}
