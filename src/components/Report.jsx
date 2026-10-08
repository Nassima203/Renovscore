import { HOUSING, PERIODS, HEATING, WORKS } from '../lib/estimate.js'

const fmt = (n) => Math.round(n).toLocaleString('fr-FR')
const fmt1 = (n) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

// Une image simple pour chaque chantier
const WHY = {
  combles:
    "La chaleur monte. Un toit mal isolé, c'est comme une casserole sans couvercle : la chaleur s'échappe par le haut.",
  murs: "Les murs entourent toute la maison. Les isoler, c'est comme mettre un gros pull à votre logement.",
  fenetres: "Les vieilles fenêtres laissent passer le froid et les courants d'air. Le double vitrage les bloque.",
  vmc: "Elle renouvelle l'air sans laisser filer la chaleur, et évite l'humidité une fois la maison bien isolée.",
  pac: "Elle récupère la chaleur de l'air extérieur, même quand il fait froid. Pour 1 € d'électricité, elle produit environ 3 € de chaleur.",
}

export default function Report({ input, result }) {
  const housing = HOUSING[input.housing].label.toLowerCase()
  const period = PERIODS[input.period].label.toLowerCase()
  const heating = HEATING[input.heating].label.toLowerCase()
  const perMonth = Math.round(result.yearlySaving / 12)
  const gains = result.breakdown.filter((b) => b.euroSaved > 0)
  const maxGain = Math.max(1, ...gains.map((b) => b.euroSaved))
  const losses = result.breakdown.filter((b) => b.euroSaved < 0)
  const best = gains.slice().sort((a, b) => b.euroSaved - a.euroSaved)[0]
  const improved = result.labelAfter < result.labelBefore

  return (
    <section className="card report" aria-labelledby="report-title">
      <div className="card__body">
        <p className="eyebrow">Votre résultat expliqué simplement</p>
        <h2 id="report-title">Qu'est-ce que ça veut dire pour vous ?</h2>

        {/* En résumé */}
        <div className="summary">
          <div className="summary__item">
            <span className="summary__label">Aujourd'hui</span>
            <span className="summary__value">{fmt(result.costBefore)} €</span>
            <span className="summary__hint">de chauffage par an</span>
          </div>
          <span className="summary__arrow" aria-hidden="true">→</span>
          <div className="summary__item">
            <span className="summary__label">Après les travaux</span>
            <span className="summary__value">{fmt(result.costAfter)} €</span>
            <span className="summary__hint">de chauffage par an</span>
          </div>
          <span className="summary__arrow" aria-hidden="true">=</span>
          <div className="summary__item summary__item--win">
            <span className="summary__label">Vous gardez</span>
            <span className="summary__value">{fmt(result.yearlySaving)} €</span>
            <span className="summary__hint">par an, soit environ {fmt(perMonth)} € par mois</span>
          </div>
        </div>
        <p className="report__lead">
          Pour votre {housing} de {fmt(input.surface)} m² construit(e) {period} et chauffé(e) au {heating}, ces
          travaux réduiraient votre facture de chauffage d'environ <strong>{result.savingPct} %</strong>.
        </p>

        {/* D'où vient l'économie */}
        <div className="report__block">
          <h3>D'où vient cette économie ?</h3>
          <div className="gains">
            {gains.map((b) => (
              <div key={b.key} className="gain">
                <div className="gain__head">
                  <span className="gain__icon" aria-hidden="true">
                    {WORKS[b.key].icon}
                  </span>
                  <strong className="gain__name">{WORKS[b.key].label}</strong>
                  <span className="gain__euro">≈ {fmt(b.euroSaved)} €/an</span>
                </div>
                <span className="gain__bar" aria-hidden="true">
                  <span className="gain__fill" style={{ width: `${(b.euroSaved / maxGain) * 100}%` }} />
                </span>
                <p className="gain__why">{WHY[b.key]}</p>
              </div>
            ))}
          </div>
          {best && gains.length > 1 && (
            <p className="tip">
              👉 Si vous ne deviez faire qu'un seul chantier, ce serait <strong>{WORKS[best.key].label.toLowerCase()}</strong> :
              c'est lui qui rapporte le plus.
            </p>
          )}
          {losses.length > 0 && (
            <p className="tip tip--warn">
              ⚠️ Vous vous chauffez déjà au bois, une énergie peu chère. La pompe à chaleur ne vous ferait pas vraiment
              économiser (environ {fmt(Math.abs(losses[0].euroSaved))} € de plus par an). Elle apporte surtout du confort.
            </p>
          )}
        </div>

        {/* Pourquoi pas l'addition */}
        {gains.length > 1 && (
          <div className="report__block">
            <h3>Pourquoi les économies ne s'additionnent pas ?</h3>
            <p>
              Imaginez que votre maison perde 100 € de chaleur. L'isolation du toit en rattrape 25 €, il reste 75 €.
              Les murs rattrapent ensuite 20 % de ces 75 €, soit 15 €, et non 20 €. Chaque chantier agit sur ce qui
              reste : c'est pour ça que le premier rapporte toujours le plus.
            </p>
          </div>
        )}

        {/* Étiquette */}
        <div className="report__block">
          <h3>Votre étiquette énergie</h3>
          <p>
            C'est la même idée que sur un frigo : <strong>A</strong> = très économe, <strong>G</strong> = très gourmand.{' '}
            {improved ? (
              <>
                Votre logement passerait de <strong>{result.labelBefore}</strong> à <strong>{result.labelAfter}</strong>.
              </>
            ) : (
              <>Votre logement resterait en <strong>{result.labelAfter}</strong>.</>
            )}
          </p>
          <div className="scale" role="img" aria-label={`Étiquette ${result.labelBefore} avant, ${result.labelAfter} après`}>
            {LETTERS.map((l, i) => (
              <div key={l} className="scale__row">
                <span className={`scale__bar label-${l}`} style={{ width: `${30 + i * 9}%` }}>
                  {l}
                </span>
                {l === result.labelBefore && l !== result.labelAfter && (
                  <span className="scale__tag scale__tag--before">Aujourd'hui</span>
                )}
                {l === result.labelAfter && (
                  <span className="scale__tag scale__tag--after">{improved ? 'Après travaux' : 'Avant et après'}</span>
                )}
              </div>
            ))}
          </div>
          {improved && LETTERS.indexOf(result.labelBefore) >= 5 && (
            <p className="tip">
              Bon à savoir : les logements classés F et G sont considérés comme des « passoires thermiques ». Les
              améliorer est aussi une bonne nouvelle pour sa valeur et pour la location.
            </p>
          )}
        </div>

        {/* Planète */}
        <div className="report__block">
          <h3>Et pour la planète ?</h3>
          <p>
            Vous rejetteriez environ <strong>{fmt1(result.co2SavedKg / 1000)} tonne(s) de CO₂ en moins</strong> chaque
            année. Le CO₂ est le gaz qui réchauffe le climat.
          </p>
        </div>

        {/* Bon à savoir */}
        <div className="report__block">
          <h3>Bon à savoir</h3>
          <ul className="report__list">
            <li>
              C'est une <strong>estimation</strong> faite à partir de moyennes. Votre vraie facture dépend aussi de votre
              région, de la température de chauffe et de vos habitudes.
            </li>
            <li>
              Le <strong>prix des travaux</strong> et les <strong>aides de l'État</strong> ne sont pas comptés ici.
            </li>
            <li>
              L'étiquette affichée est indicative : le vrai diagnostic (DPE) ne peut être fait que par un professionnel
              certifié.
            </li>
          </ul>
        </div>

        {/* Suite */}
        <div className="report__block report__next">
          <h3>Et maintenant ?</h3>
          <ol>
            <li>Faites faire un audit énergétique : un expert vient chez vous et vous dit quoi faire en premier.</li>
            <li>Demandez plusieurs devis à des artisans « RGE » : c'est obligatoire pour avoir la plupart des aides.</li>
            <li>Contactez un conseiller France Rénov' : c'est un service public gratuit qui vous aide pour les aides.</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
