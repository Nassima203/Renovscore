// Lettres de l'étiquette énergie, de la plus économe à la plus gourmande
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// Accroche en haut de page, avec une étiquette énergie décorative
export default function Hero({ onStart }) {
  return (
    <section className="hero">
      <div className="container hero__grid">
        <div>
          <p className="eyebrow">Rénovation énergétique</p>
          <h1>
            Combien vos travaux peuvent-ils vous faire <em>économiser</em> ?
          </h1>
          <p className="hero__lead">
            Isolation, fenêtres, pompe à chaleur… Répondez à 3 questions et obtenez une estimation indicative de vos
            économies annuelles et de votre nouvelle étiquette énergie.
          </p>
          <div className="hero__actions">
            <button className="btn" onClick={onStart}>
              Lancer la simulation
            </button>
            <span className="hero__note">⏱ 1 minute · gratuit · sans inscription</span>
          </div>
        </div>

        {/* Illustration : barres A → G et exemple de passage F → C */}
        <div className="hero__card" aria-hidden="true">
          <div className="energy-scale">
            {LETTERS.map((letter, i) => (
              <div key={letter} className={`energy-scale__bar label-${letter}`} style={{ width: `${45 + i * 9}%` }}>
                {letter}
              </div>
            ))}
          </div>
          <div className="hero__arrow">
            <span className="pill label-F">F</span>
            <span>→</span>
            <span className="pill label-C">C</span>
          </div>
        </div>
      </div>
    </section>
  )
}
