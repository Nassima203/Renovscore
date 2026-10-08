import { WORKS } from '../lib/estimate.js'

const fmt = (n) => n.toLocaleString('fr-FR')

export default function Results({ result, input, onRestart }) {
  const maxCost = Math.max(result.costBefore, 1)

  return (
    <div className="card results">
      <div className="card__body">
        <p className="eyebrow">Votre estimation indicative</p>
        <h2>
          Jusqu'à <span className="highlight">{fmt(result.yearlySaving)} €</span> d'économies par an
        </h2>
        <p className="muted">
          Travaux simulés : {result.works.map((w) => WORKS[w].label.toLowerCase()).join(', ')}.
        </p>

        <div className="kpis">
          <div className="kpi">
            <span className="kpi__value">−{result.savingPct} %</span>
            <span className="kpi__label">sur la facture de chauffage</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{fmt(Math.round(result.co2SavedKg / 100) / 10)} t</span>
            <span className="kpi__label">de CO₂ évitées par an</span>
          </div>
          <div className="kpi">
            <span className="kpi__value labels">
              <span className={`pill label-${result.labelBefore}`}>{result.labelBefore}</span>→
              <span className={`pill label-${result.labelAfter}`}>{result.labelAfter}</span>
            </span>
            <span className="kpi__label">étiquette estimée</span>
          </div>
        </div>

        <div className="bars" aria-label="Facture annuelle avant et après travaux">
          <div className="bar">
            <span>Avant</span>
            <div className="bar__track">
              <div className="bar__fill bar__fill--before" style={{ width: '100%' }} />
            </div>
            <strong>{fmt(result.costBefore)} €/an</strong>
          </div>
          <div className="bar">
            <span>Après</span>
            <div className="bar__track">
              <div
                className="bar__fill bar__fill--after"
                style={{ width: `${Math.max(4, (result.costAfter / maxCost) * 100)}%` }}
              />
            </div>
            <strong>{fmt(result.costAfter)} €/an</strong>
          </div>
        </div>

        <p className="disclaimer">
          Estimation basée sur des moyennes nationales, à titre indicatif uniquement. Seul un audit énergétique
          réalisé par un professionnel permet de chiffrer précisément vos économies et vos aides.
        </p>

        <button className="btn btn--ghost" onClick={onRestart}>
          ↺ Refaire une simulation
        </button>
      </div>
    </div>
  )
}
