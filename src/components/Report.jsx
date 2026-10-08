import { HOUSING, PERIODS, HEATING, WORKS, ZONES, LABEL_THRESHOLDS } from '../lib/estimate.js'
import { DEPARTMENTS } from '../lib/departments.js'

const fmt = (n) => Math.round(n).toLocaleString('fr-FR')
const dec = (n, d = 2) => n.toLocaleString('fr-FR', { maximumFractionDigits: d })
const pct = (f) => `${f >= 1 ? '+' : '−'}${Math.round(Math.abs(f - 1) * 100)} %`
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

const WHY = {
  combles:
    "La toiture concentre jusqu'à un quart des pertes de chaleur d'une maison mal isolée. C'est en général le chantier le plus rentable.",
  murs: "Les murs représentent la plus grande surface en contact avec l'extérieur. Leur isolation réduit les pertes et supprime l'effet de paroi froide.",
  fenetres: 'Le double vitrage limite les pertes par les vitrages et les infiltrations d’air autour des menuiseries.',
  vmc: 'Une ventilation contrôlée renouvelle l’air en limitant les pertes de chaleur et évite l’humidité dans un logement mieux isolé.',
  pac: 'La pompe à chaleur ne réduit pas les besoins de chaleur : elle les produit plus efficacement en captant les calories de l’air extérieur.',
}

export default function Report({ input, result }) {
  const a = result.assumptions
  const st = result.steps
  const dept = DEPARTMENTS[input.department]
  const zone = dept ? ZONES[dept.zone] : null
  const heating = HEATING[input.heating].label.toLowerCase()
  const gains = result.breakdown
  const totalPositive = Math.max(1, ...gains.map((b) => Math.max(0, b.euroSaved)))
  const best = gains.filter((b) => b.euroSaved > 0).sort((x, y) => y.euroSaved - x.euroSaved)[0]
  const pac = result.works.includes('pac')
  const done = (input.alreadyDone || []).filter((w) => WORKS[w])
  const co2Pct = result.co2BeforeKg > 0 ? Math.round((result.co2SavedKg / result.co2BeforeKg) * 100) : 0

  // Étapes de calcul de la consommation actuelle
  const chain = [
    {
      label: `Logement moyen de cette époque (${fmt(a.kwhM2Period)} kWh/m²${a.housingFactor !== 1 ? ' × 0,8 en appartement' : ''})`,
      value: st.reference,
    },
    zone && { label: `Climat ${dept.zone} de votre département (${pct(a.climateFactor)})`, value: st.climate },
    { label: `Chauffage à ${input.temperature} °C (${pct(a.tempFactor)})`, value: st.temperature },
    done.length > 0 && {
      label: `Travaux déjà réalisés (${done.map((w) => WORKS[w].label.toLowerCase()).join(', ')})`,
      value: st.alreadyDone,
    },
  ].filter(Boolean)

  return (
    <section className="card report" aria-labelledby="report-title">
      <div className="card__body">
        <p className="eyebrow">Rapport détaillé</p>
        <h2 id="report-title">Comprendre votre résultat</h2>

        <div className="summary">
          <div className="summary__item">
            <span className="summary__label">Aujourd'hui</span>
            <span className="summary__value">{fmt(result.costBefore)} €</span>
            <span className="summary__hint">{fmt(result.kwhBefore)} kWh de chauffage par an</span>
          </div>
          <span className="summary__arrow" aria-hidden="true">→</span>
          <div className="summary__item">
            <span className="summary__label">Après travaux</span>
            <span className="summary__value">{fmt(result.costAfter)} €</span>
            <span className="summary__hint">{fmt(result.kwhAfter)} kWh par an</span>
          </div>
          <span className="summary__arrow" aria-hidden="true">=</span>
          <div className="summary__item summary__item--win">
            <span className="summary__label">Économie</span>
            <span className="summary__value">{fmt(result.yearlySaving)} €/an</span>
            <span className="summary__hint">
              soit {fmt(result.yearlySaving / 12)} € par mois · −{result.savingPct} %
            </span>
          </div>
        </div>

        {/* 1. Consommation actuelle */}
        <div className="report__block">
          <h3>1. Votre consommation actuelle</h3>
          <p>
            Nous partons de la consommation moyenne d'un logement de la même époque, puis nous l'ajustons à votre
            situation :
          </p>
          <ol className="chain">
            {chain.map((c, i) => (
              <li key={i} className="chain__row">
                <span>{c.label}</span>
                <strong>{fmt(c.value)} kWh/an</strong>
              </li>
            ))}
          </ol>
          <p>
            Au prix moyen du {heating} ({dec(a.price, 3)} €/kWh), cela représente{' '}
            <strong>{fmt(result.costBefore)} € par an</strong>.
            {zone && dept.zone === 'H1' && ' Votre département a des hivers longs et froids : les travaux y sont particulièrement rentables.'}
            {zone && dept.zone === 'H3' && ' Avec un climat méditerranéen, vos besoins de chauffage sont faibles : les économies en euros sont donc plus modestes.'}
            {input.temperature > 20 &&
              ` Baisser le chauffage à 19 °C réduirait déjà votre facture d'environ ${Math.round((input.temperature - 19) * a.perDegree * 100)} %, sans aucun travaux.`}
          </p>
        </div>

        {/* 2. Gain par chantier */}
        <div className="report__block">
          <h3>2. Ce que rapporte chaque chantier</h3>
          <div className="gains">
            {gains.map((b) => (
              <div key={b.key} className="gain">
                <div className="gain__head">
                  <span className="gain__icon" aria-hidden="true">
                    {WORKS[b.key].icon}
                  </span>
                  <strong className="gain__name">{WORKS[b.key].label}</strong>
                  <span className={`gain__euro ${b.euroSaved < 0 ? 'neg' : ''}`}>
                    {b.euroSaved >= 0 ? '−' : '+'}
                    {fmt(Math.abs(b.euroSaved))} €/an
                  </span>
                </div>
                <span className="gain__bar" aria-hidden="true">
                  <span className="gain__fill" style={{ width: `${(Math.max(0, b.euroSaved) / totalPositive) * 100}%` }} />
                </span>
                <p className="gain__why">
                  {WHY[b.key]}
                  {b.key !== 'pac' && ` Gain estimé : −${Math.round(WORKS[b.key].saving * 100)} % des besoins restants, soit ${fmt(b.kwhSaved)} kWh/an.`}
                  {b.key === 'pac' &&
                    ` Dans votre zone, elle produit environ ${dec(a.cop, 1)} kWh de chaleur pour 1 kWh d'électricité.`}
                </p>
              </div>
            ))}
          </div>
          {best && gains.length > 1 && (
            <p className="tip">
              Le chantier le plus rentable pour vous : <strong>{WORKS[best.key].label.toLowerCase()}</strong>.
            </p>
          )}
          {gains.some((b) => b.euroSaved < 0) && (
            <p className="tip tip--warn">
              Avec un chauffage au bois, déjà peu coûteux, la pompe à chaleur n'est pas rentable sur la facture. Son
              intérêt est surtout le confort et l'automatisation.
            </p>
          )}
          {gains.length > 1 && (
            <p className="report__small">
              Les gains ne s'additionnent pas : chaque chantier réduit ce qu'il reste à chauffer après le précédent.
              Isoler les combles (−25 %) puis les murs (−20 %) donne −40 % au total, et non −45 %.
              {pac && ' La pompe à chaleur est comptée en dernier, sur les besoins restants.'}
            </p>
          )}
        </div>

        {/* 3. Étiquette */}
        <div className="report__block">
          <h3>3. Votre étiquette énergie</h3>
          <div className="scale" role="img" aria-label={`Étiquette ${result.labelBefore} avant, ${result.labelAfter} après`}>
            {LETTERS.map((l, i) => (
              <div key={l} className="scale__row">
                <span className={`scale__bar label-${l}`} style={{ width: `${30 + i * 9}%` }}>
                  {l}
                  <span className="scale__range">
                    {i === 0
                      ? `≤ ${LABEL_THRESHOLDS[0].max}`
                      : i === 6
                        ? `> ${LABEL_THRESHOLDS[5].max}`
                        : `${LABEL_THRESHOLDS[i - 1].max + 1}–${LABEL_THRESHOLDS[i].max}`}
                  </span>
                </span>
                {l === result.labelBefore && l !== result.labelAfter && (
                  <span className="scale__tag scale__tag--before">Aujourd'hui · {fmt(result.kwhM2Before)}</span>
                )}
                {l === result.labelAfter && (
                  <span className="scale__tag scale__tag--after">Après · {fmt(result.kwhM2After)}</span>
                )}
              </div>
            ))}
          </div>
          <p className="report__small">
            Valeurs en kWh de chauffage par m² et par an. Cette classe est indicative : le DPE officiel inclut aussi
            l'eau chaude, les émissions de CO₂ et compte l'électricité en énergie primaire. Il doit être réalisé par
            un diagnostiqueur certifié.
          </p>
        </div>

        {/* 4. Climat */}
        <div className="report__block">
          <h3>4. Impact sur les émissions de CO₂</h3>
          <p>
            Vos émissions liées au chauffage passeraient d'environ {dec(result.co2BeforeKg / 1000, 1)} t à{' '}
            {dec((result.co2BeforeKg - result.co2SavedKg) / 1000, 1)} t de CO₂ par an, soit{' '}
            <strong>−{co2Pct} %</strong>.
            {pac && (input.heating === 'fioul' || input.heating === 'gaz')
              ? " L'essentiel de la baisse vient de l'abandon du " + heating + " au profit de l'électricité, peu carbonée en France."
              : ''}
          </p>
        </div>

        {/* 5. Hypothèses */}
        <details className="report__block report__assumptions">
          <summary>5. Hypothèses de calcul</summary>
          <ul className="report__list">
            <li>
              Consommation de référence : {fmt(a.kwhM2Period)} kWh/m²/an pour un logement construit{' '}
              {PERIODS[input.period].label.toLowerCase()}, climat moyen, 20 °C
              {a.housingFactor !== 1 ? ` ; ${HOUSING[input.housing].label.toLowerCase()} : × 0,8` : ''}.
            </li>
            {zone && (
              <li>
                Zone climatique {dept.zone} : coefficient × {dec(a.climateFactor)}, d'après les écarts entre zones des
                fiches CEE (H1 : 1 700, H2 : 1 400, H3 : 900 kWh cumac par m² isolé).
              </li>
            )}
            <li>Température : environ {Math.round(a.perDegree * 100)} % de consommation par degré au-dessus ou en dessous de 20 °C.</li>
            <li>
              {HEATING[input.heating].label} : {dec(a.price, 3)} €/kWh et {dec(a.co2, 3)} kg CO₂/kWh.
            </li>
            {pac && (
              <li>
                Pompe à chaleur : rendement de {dec(a.cop, 1)} en zone {a.zone || 'moyenne'}, électricité à{' '}
                {dec(a.elecPrice, 2)} €/kWh et {dec(a.elecCo2, 3)} kg CO₂/kWh.
              </li>
            )}
            <li>Gains : combles −25 %, murs −20 %, fenêtres −10 %, ventilation −7 %, appliqués successivement.</li>
            <li>Non pris en compte : eau chaude, coût des travaux, aides financières, évolution des prix.</li>
          </ul>
        </details>

        {/* 6. Suite */}
        <div className="report__block report__next">
          <h3>6. Prochaines étapes</h3>
          <ol>
            <li>Un audit énergétique, pour chiffrer précisément vos pertes et l'ordre des travaux.</li>
            <li>Des devis auprès d'artisans certifiés RGE, condition pour la plupart des aides.</li>
            <li>Un rendez-vous avec un conseiller France Rénov', service public gratuit, pour le financement.</li>
          </ol>
        </div>
      </div>
    </section>
  )
}
