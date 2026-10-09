import { WORKS } from '../lib/estimate.js'
import { formatNumber } from '../lib/format.js'

// Carte de résultats : économie annuelle, indicateurs clés et facture avant / après
export default function Results({ result, onRestart }) {
  const worksList = result.works.map((key) => WORKS[key].label.toLowerCase()).join(', ')
  // Largeur de la barre « Après », proportionnelle à la facture d'avant (4 % minimum pour rester visible)
  const afterWidth = Math.max(4, (result.costAfter / Math.max(result.costBefore, 1)) * 100)

  return (
    <div className="card">
      <div className="card__body">
        <p className="eyebrow">Votre estimation indicative</p>
        <h2>
          Jusqu'à <span className="highlight">{formatNumber(result.yearlySaving)} €</span> d'économies par an
        </h2>
        <p className="muted">Travaux simulés : {worksList}.</p>

        {/* Indicateurs clés */}
        <div className="kpis">
          <div className="kpi">
            <span className="kpi__value">−{result.savingPct} %</span>
            <span className="kpi__label">sur la facture de chauffage</span>
          </div>
          <div className="kpi">
            <span className="kpi__value">{formatNumber(result.co2SavedKg / 1000, 1)} t</span>
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

        {/* Facture annuelle avant / après */}
        <div className="bars" aria-label="Facture annuelle avant et après travaux">
          <div className="bar">
            <span>Avant</span>
            <div className="bar__track">
              <div className="bar__fill bar__fill--before" style={{ width: '100%' }} />
            </div>
            <strong>{formatNumber(result.costBefore)} €/an</strong>
          </div>
          <div className="bar">
            <span>Après</span>
            <div className="bar__track">
              <div className="bar__fill bar__fill--after" style={{ width: `${afterWidth}%` }} />
            </div>
            <strong>{formatNumber(result.costAfter)} €/an</strong>
          </div>
        </div>

        <p className="disclaimer">
          Estimation basée sur des moyennes nationales, à titre indicatif uniquement. Seul un audit énergétique réalisé
          par un professionnel permet de chiffrer précisément vos économies et vos aides.
        </p>

        <button className="btn btn--ghost" onClick={onRestart}>
          ↺ Refaire une simulation
        </button>
      </div>
    </div>
  )
}
