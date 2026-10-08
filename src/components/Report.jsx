import { HOUSING, PERIODS, HEATING, WORKS, LABEL_THRESHOLDS } from '../lib/estimate.js'

const fmt = (n) => Math.round(n).toLocaleString('fr-FR')
const fmt2 = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const WORK_EXPLAIN = {
  combles: "La chaleur monte : un toit mal isolé laisse s'échapper jusqu'à un quart de la chaleur. C'est souvent le chantier le plus rentable.",
  murs: "Les murs sont la plus grande surface en contact avec l'extérieur. Les isoler (par l'intérieur ou l'extérieur) limite les pertes et les parois froides.",
  fenetres: "Le double vitrage réduit les pertes par les vitres et les infiltrations d'air autour des menuiseries.",
  vmc: "Une ventilation maîtrisée renouvelle l'air sans laisser partir la chaleur n'importe comment, et évite l'humidité dans un logement mieux isolé.",
  pac: "Une pompe à chaleur puise des calories dans l'air extérieur : pour 1 kWh d'électricité consommé, elle restitue environ 3 kWh de chaleur.",
}

export default function Report({ input, result }) {
  const housing = HOUSING[input.housing].label.toLowerCase()
  const period = PERIODS[input.period].label.toLowerCase()
  const heating = HEATING[input.heating]
  const a = result.assumptions
  const totalSaved = Math.max(1, result.breakdown.reduce((s, b) => s + Math.max(0, b.euroSaved), 0))
  const co2Pct = result.co2BeforeKg > 0 ? Math.round((result.co2SavedKg / result.co2BeforeKg) * 100) : 0
  const pac = input.works.includes('pac')

  return (
    <section className="card report" aria-labelledby="report-title">
      <div className="card__body">
        <p className="eyebrow">Rapport détaillé</p>
        <h2 id="report-title">Comprendre votre simulation</h2>
        <p className="muted">
          Voici comment nous sommes arrivés à ces chiffres, étape par étape, et ce qu'ils signifient pour votre
          logement.
        </p>

        {/* 1. Point de départ */}
        <div className="report__block">
          <h3>
            <span className="report__n">1</span> Votre logement aujourd'hui
          </h3>
          <p>
            Vous avez simulé un(e) <strong>{housing}</strong> de <strong>{fmt(input.surface)} m²</strong> construit(e){' '}
            <strong>{period}</strong>, chauffé(e) au <strong>{heating.label.toLowerCase()}</strong>.
          </p>
          <p>
            Un logement de cette époque consomme en moyenne environ <strong>{fmt(a.kwhM2Period)} kWh par m² et par an</strong>{' '}
            pour le chauffage{input.housing === 'appartement' ? ' (un peu moins en appartement, grâce aux logements voisins)' : ''}.
            Pour votre surface, cela représente environ <strong>{fmt(result.kwhBefore)} kWh par an</strong>, soit une
            facture de chauffage d'environ <strong>{fmt(result.costBefore)} € par an</strong> et{' '}
            <strong>{fmt2(result.co2BeforeKg / 1000)} tonne(s) de CO₂</strong>.
          </p>
        </div>

        {/* 2. Poste par poste */}
        <div className="report__block">
          <h3>
            <span className="report__n">2</span> Ce que chaque chantier vous fait gagner
          </h3>
          <div className="table-wrap">
            <table className="report__table">
              <thead>
                <tr>
                  <th scope="col">Travaux</th>
                  <th scope="col" className="num">Énergie économisée</th>
                  <th scope="col" className="num">Économie</th>
                  <th scope="col">Part du gain</th>
                </tr>
              </thead>
              <tbody>
                {result.breakdown.map((b) => {
                  const share = Math.max(0, b.euroSaved) / totalSaved
                  return (
                    <tr key={b.key}>
                      <th scope="row">{WORKS[b.key].label}</th>
                      <td className="num">{fmt(b.kwhSaved)} kWh/an</td>
                      <td className={`num ${b.euroSaved < 0 ? 'neg' : ''}`}>
                        {b.euroSaved >= 0 ? '−' : '+'}
                        {fmt(Math.abs(b.euroSaved))} €/an
                      </td>
                      <td>
                        <span className="share" aria-label={`${Math.round(share * 100)} %`}>
                          <span className="share__fill" style={{ width: `${Math.round(share * 100)}%` }} />
                        </span>
                        <span className="share__pct">{Math.round(share * 100)} %</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <ul className="report__list">
            {result.breakdown.map((b) => (
              <li key={b.key}>
                <strong>{WORKS[b.key].label} :</strong> {WORK_EXPLAIN[b.key]}
              </li>
            ))}
          </ul>
          {result.breakdown.some((b) => b.euroSaved < 0) && (
            <p className="report__note">
              Avec un chauffage au bois déjà peu cher, la pompe à chaleur peut coûter légèrement plus à l'usage. Son
              intérêt est alors surtout le confort et l'automatisation, pas la facture.
            </p>
          )}
        </div>

        {/* 3. Pourquoi les gains ne s'additionnent pas */}
        <div className="report__block">
          <h3>
            <span className="report__n">3</span> Pourquoi les pourcentages ne s'additionnent pas
          </h3>
          <p>
            Chaque chantier s'applique à ce qui reste à chauffer après le précédent. Par exemple, isoler les combles
            (−25 %) puis les murs (−20 %) ne fait pas −45 %, mais −40 % : les murs ne font gagner que 20 % des 75 %
            restants. C'est pour ça que le premier chantier rapporte toujours le plus.
          </p>
          {pac && (
            <p>
              La pompe à chaleur est appliquée en dernier : elle ne réduit pas les besoins de chaleur, elle les
              produit plus efficacement. Isoler d'abord permet aussi d'installer une pompe à chaleur moins puissante,
              donc moins chère.
            </p>
          )}
        </div>

        {/* 4. Étiquette */}
        <div className="report__block">
          <h3>
            <span className="report__n">4</span> Votre étiquette énergie
          </h3>
          <div className="scale" role="img" aria-label={`Étiquette ${result.labelBefore} avant, ${result.labelAfter} après`}>
            {LETTERS.map((l, i) => (
              <div key={l} className="scale__row">
                <span className={`scale__bar label-${l}`} style={{ width: `${40 + i * 8}%` }}>
                  {l}
                  <span className="scale__range">
                    {i === 0 ? `≤ ${LABEL_THRESHOLDS[0].max}` : i === 6 ? `> ${LABEL_THRESHOLDS[5].max}` : `${LABEL_THRESHOLDS[i - 1].max + 1}–${LABEL_THRESHOLDS[i].max}`} kWh/m²
                  </span>
                </span>
                {l === result.labelBefore && <span className="scale__tag scale__tag--before">Avant · {fmt(result.kwhM2Before)}</span>}
                {l === result.labelAfter && <span className="scale__tag scale__tag--after">Après · {fmt(result.kwhM2After)}</span>}
              </div>
            ))}
          </div>
          <p>
            Votre logement passerait de <strong>{fmt(result.kwhM2Before)}</strong> à{' '}
            <strong>{fmt(result.kwhM2After)} kWh/m²/an</strong>
            {result.labelBefore !== result.labelAfter
              ? `, soit de la classe ${result.labelBefore} à la classe ${result.labelAfter}.`
              : `, et resterait en classe ${result.labelAfter}.`}
          </p>
          <p className="report__note">
            Cette étiquette est une approximation fondée sur le chauffage seul. Le vrai DPE prend aussi en compte l'eau
            chaude, les émissions de CO₂ et l'énergie primaire : seul un diagnostiqueur certifié peut l'établir.
          </p>
        </div>

        {/* 5. Climat */}
        <div className="report__block">
          <h3>
            <span className="report__n">5</span> L'impact sur le climat
          </h3>
          <p>
            Vos travaux éviteraient environ <strong>{fmt2(result.co2SavedKg / 1000)} tonne(s) de CO₂ par an</strong>,
            soit <strong>{co2Pct} %</strong> des émissions liées à votre chauffage actuel.
            {pac && input.heating !== 'electrique' && input.heating !== 'bois'
              ? ' Une grande partie vient du passage à la pompe à chaleur, car l’électricité française est peu carbonée.'
              : ''}
          </p>
        </div>

        {/* 6. Hypothèses */}
        <details className="report__block report__assumptions">
          <summary>
            <span className="report__n">6</span> Les hypothèses de calcul
          </summary>
          <ul className="report__list">
            <li>
              Consommation de référence : {fmt(a.kwhM2Period)} kWh/m²/an pour un logement construit {period}
              {a.housingFactor !== 1 ? `, × ${String(a.housingFactor).replace('.', ',')} pour un appartement` : ''}.
            </li>
            <li>
              Prix moyen du {heating.label.toLowerCase()} : {fmt2(a.price)} €/kWh · émissions : {fmt2(a.co2)} kg CO₂/kWh.
            </li>
            {pac && (
              <li>
                Pompe à chaleur : rendement (COP) de {a.cop}, électricité à {fmt2(a.elecPrice)} €/kWh et{' '}
                {fmt2(a.elecCo2)} kg CO₂/kWh.
              </li>
            )}
            <li>Gains moyens : combles −25 %, murs −20 %, fenêtres −10 %, ventilation −7 %.</li>
            <li>Ne sont pas pris en compte : eau chaude, coût des travaux, aides financières, comportement des occupants.</li>
          </ul>
        </details>

        {/* 7. Suite */}
        <div className="report__block report__next">
          <h3>
            <span className="report__n">7</span> Et maintenant ?
          </h3>
          <ol>
            <li>Faites réaliser un audit énergétique : il chiffre précisément vos pertes et l'ordre des travaux.</li>
            <li>Demandez plusieurs devis à des artisans certifiés RGE, condition pour obtenir la plupart des aides.</li>
            <li>Renseignez-vous sur les aides auprès d'un conseiller France Rénov', service public gratuit.</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
