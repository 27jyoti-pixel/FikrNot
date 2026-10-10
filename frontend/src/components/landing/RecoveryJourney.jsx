import "./RecoveryJourney.css";

const checkpoints = [
  { number: "01", title: "Report", description: "Share details about your lost item." },
  { number: "02", title: "Discover", description: "Browse items reported on your campus." },
  { number: "03", title: "Possible match", description: "Get a suggestion based on item details." },
  { number: "04", title: "Rector verified", description: "Your Rector reviews the claim." },
  { number: "05", title: "Reunited", description: "Confirm handover, then Rector completes recovery." },
];

export default function RecoveryJourney() {
  return (
    <section className="recovery-journey" id="home-how-it-works" aria-labelledby="home-guide-title">
      <div className="recovery-journey__inner">
        <header className="recovery-journey__heading">
          <p className="recovery-journey__eyebrow">A clearer way to recover</p>
          <h2 id="home-guide-title">From lost to <em>found.</em></h2>
        </header>

        <div className="recovery-journey__steps">
          <svg className="recovery-journey__connector" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 32 C65 32 65 5 130 5 S195 55 260 55 325 5 390 5 455 55 520 55 585 5 650 5 715 55 780 55 845 5 910 5 935 32 1000 32" />
          </svg>

          {checkpoints.map((point) => (
            <article className="recovery-checkpoint" key={point.number}>
              <div className="recovery-checkpoint__visual">
                <span className="recovery-checkpoint__art">
                  <img className="recovery-checkpoint__carrot" src={`/journey-assets/carrot-${point.number}.png`} alt="" aria-hidden="true" />
                  <img className="recovery-checkpoint__top-extension" src={`/journey-assets/carrot-top-${point.number}.png`} alt="" aria-hidden="true" />
                </span>
                <span className="recovery-checkpoint__number">{point.number}</span>
              </div>
              <div className="recovery-checkpoint__copy">
                <h3>{point.title}</h3>
                <p>{point.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

