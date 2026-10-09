import { HOUSING, PERIODS, HEATING, WORKS, LABELS, PER_DEGREE } from '../lib/estimate.js'
import { DEPARTMENTS } from '../lib/departments.js'
import { formatNumber } from '../lib/format.js'

// Écart en pourcentage à partir d'un coefficient : 1,1 → « +10 % », 0,9 → « −10 % »
const percent = (factor) => `${factor >= 1 ? '+' : '−'}${Math.round(Math.abs(factor - 1) * 100)} %`

// Plage de consommation de chaque étiquette, par exemple « 111–180 »
const rangeLabel = (i) => {
  if (i === 0) return `≤ ${LABELS[0].max}`
  if (i === LABELS.length - 1) return `> ${LABELS[i - 1].max}`
  return `${LABELS[i - 1].max + 1}–${LABELS[i].max}`
}

// Explication de chaque type de travaux
const WHY = {
  combles:
    "La toiture concentre jusqu'à un quart des pertes de chaleur d'une maison mal isolée. C'est en général le chantier le plus rentable.",
  murs: "Les murs représentent la plus grande surface en contact avec l'extérieur. Leur isolation réduit les pertes et supprime l'effet de paroi froide.",
  fenetres: 'Le double vitrage limite les pertes par les vitrages et les infiltrations d’air autour des menuiseries.',
  vmc: 'Une ventilation contrôlée renouvelle l’air en limitant les pertes de chaleur et évite l’humidité dans un logement mieux isolé.',
  pac: 'La pompe à chaleur ne réduit pas les besoins de chaleur : elle les produit plus efficacement en captant les calories de l’air extérieur.',
}

// Bloc du rapport avec son titre
function Section({ title, children }) {
  return (
    <div className="report__block">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

// Rapport détaillé : explication pas à pas du résultat
export default function Report({ input, result }) {
  const { steps, factors, breakdown } = result
  const dept = DEPARTMENTS[input.department]
  const heat = HEATING[input.heating]
  const elec = HEATING.electrique
  const heatingName = heat.label.toLowerCase()
  const kwhM2Period = PERIODS[input.period].kwhM2
  const isFlat = input.housing === 'appartement'
  const usesPac = result.works.includes('pac')
  const done = (input.alreadyDone || []).filter((key) => WORKS[key])
  const co2Pct = result.co2BeforeKg > 0 ? Math.round((result.co2SavedKg / result.co2BeforeKg) * 100) : 0

  // Gain le plus élevé (pour la barre la plus longue et le conseil)
  const maxGain = Math.max(1, ...breakdown.map((b) => b.euroSaved))
  const best = breakdown.filter((b) => b.euroSaved > 0).sort((a, b) => b.euroSaved - a.euroSaved)[0]

  // Étapes du calcul de la consommation actuelle (kWh/an)
  const chain = [
    {
      label: `Logement moyen de cette époque (${kwhM2Period} kWh/m²${isFlat ? ' × 0,8 en appartement' : ''})`,
      value: steps.reference,
    },
    dept && { label: `Climat ${dept.zone} de votre département (${percent(factors.climate)})`, value: steps.climate },
    { label: `Chauffage à ${input.temperature} °C (${percent(factors.temperature)})`, value: steps.temperature },
    done.length > 0 && {
      label: `Travaux déjà réalisés (${done.map((key) => WORKS[key].label.toLowerCase()).join(', ')})`,
      value: steps.alreadyDone,
    },
  ].filter(Boolean)

  return (
    <section className="card report" aria-labelledby="report-title">
      <div className="card__body">
        <p className="eyebrow">Rapport détaillé</p>
        <h2 id="report-title">Comprendre votre résultat</h2>

        {/* Résumé : aujourd'hui → après travaux = économie */}
        <div className="summary">
          <div className="summary__item">
            <span className="summary__label">Aujourd'hui</span>
            <span className="summary__value">{formatNumber(result.costBefore)} €</span>
            <span className="summary__hint">{formatNumber(result.kwhBefore)} kWh de chauffage par an</span>
          </div>
          <span className="summary__arrow" aria-hidden="true">→</span>
          <div className="summary__item">
            <span className="summary__label">Après travaux</span>
            <span className="summary__value">{formatNumber(result.costAfter)} €</span>
            <span className="summary__hint">{formatNumber(result.kwhAfter)} kWh par an</span>
          </div>
          <span className="summary__arrow" aria-hidden="true">=</span>
          <div className="summary__item summary__item--win">
            <span className="summary__label">Économie</span>
            <span className="summary__value">{formatNumber(result.yearlySaving)} €/an</span>
            <span className="summary__hint">
              soit {formatNumber(result.yearlySaving / 12)} € par mois · −{result.savingPct} %
            </span>
          </div>
        </div>

        <Section title="1. Votre consommation actuelle">
          <p>
            Nous partons de la consommation moyenne d'un logement de la même époque, puis nous l'ajustons à votre
            situation :
          </p>
          <ol className="chain">
            {chain.map((row) => (
              <li key={row.label} className="chain__row">
                <span>{row.label}</span>
                <strong>{formatNumber(row.value)} kWh/an</strong>
              </li>
            ))}
          </ol>
          <p>
            Au prix moyen du {heatingName} ({formatNumber(heat.price, 3)} €/kWh), cela représente{' '}
            <strong>{formatNumber(result.costBefore)} € par an</strong>.
            {dept?.zone === 'H1' &&
              ' Votre département a des hivers longs et froids : les travaux y sont particulièrement rentables.'}
            {dept?.zone === 'H3' &&
              ' Avec un climat méditerranéen, vos besoins de chauffage sont faibles : les économies en euros sont donc plus modestes.'}
            {input.temperature > 20 &&
              ` Baisser le chauffage à 19 °C réduirait déjà votre facture d'environ ${Math.round((input.temperature - 19) * PER_DEGREE * 100)} %, sans aucun travaux.`}
          </p>
        </Section>

        <Section title="2. Ce que rapporte chaque chantier">
          <div className="gains">
            {breakdown.map((b) => (
              <div key={b.key}>
                <div className="gain__head">
                  <span className="gain__icon" aria-hidden="true">
                    {WORKS[b.key].icon}
                  </span>
                  <strong className="gain__name">{WORKS[b.key].label}</strong>
                  <span className={`gain__euro ${b.euroSaved < 0 ? 'is-negative' : ''}`}>
                    {b.euroSaved >= 0 ? '−' : '+'}
                    {formatNumber(Math.abs(b.euroSaved))} €/an
                  </span>
                </div>
                <span className="gain__bar" aria-hidden="true">
                  <span className="gain__fill" style={{ width: `${(Math.max(0, b.euroSaved) / maxGain) * 100}%` }} />
                </span>
                <p className="gain__why">
                  {WHY[b.key]}{' '}
                  {b.key === 'pac'
                    ? `Dans votre zone, elle produit environ ${formatNumber(factors.cop, 1)} kWh de chaleur pour 1 kWh d'électricité.`
                    : `Gain estimé : −${Math.round(WORKS[b.key].saving * 100)} % des besoins restants, soit ${formatNumber(b.kwhSaved)} kWh/an.`}
                </p>
              </div>
            ))}
          </div>
          {best && breakdown.length > 1 && (
            <p className="tip">
              Le chantier le plus rentable pour vous : <strong>{WORKS[best.key].label.toLowerCase()}</strong>.
            </p>
          )}
          {breakdown.some((b) => b.euroSaved < 0) && (
            <p className="tip tip--warn">
              Avec un chauffage au bois, déjà peu coûteux, la pompe à chaleur n'est pas rentable sur la facture. Son
              intérêt est surtout le confort et l'automatisation.
            </p>
          )}
          {breakdown.length > 1 && (
            <p className="report__note">
              Les gains ne s'additionnent pas : chaque chantier réduit ce qu'il reste à chauffer après le précédent.
              Isoler les combles (−25 %) puis les murs (−20 %) donne −40 % au total, et non −45 %.
              {usesPac && ' La pompe à chaleur est comptée en dernier, sur les besoins restants.'}
            </p>
          )}
        </Section>

        <Section title="3. Votre étiquette énergie">
          <div
            className="scale"
            role="img"
            aria-label={`Étiquette ${result.labelBefore} avant, ${result.labelAfter} après`}
          >
            {LABELS.map(({ letter }, i) => (
              <div key={letter} className="scale__row">
                <span className={`scale__bar label-${letter}`} style={{ width: `${30 + i * 9}%` }}>
                  {letter}
                  <span className="scale__range">{rangeLabel(i)}</span>
                </span>
                {letter === result.labelBefore && letter !== result.labelAfter && (
                  <span className="scale__tag scale__tag--before">Aujourd'hui · {result.kwhM2Before}</span>
                )}
                {letter === result.labelAfter && (
                  <span className="scale__tag scale__tag--after">Après · {result.kwhM2After}</span>
                )}
              </div>
            ))}
          </div>
          <p className="report__note">
            Valeurs en kWh de chauffage par m² et par an. Cette classe est indicative : le DPE officiel inclut aussi
            l'eau chaude, les émissions de CO₂ et compte l'électricité en énergie primaire. Il doit être réalisé par un
            diagnostiqueur certifié.
          </p>
        </Section>

        <Section title="4. Impact sur les émissions de CO₂">
          <p>
            Vos émissions liées au chauffage passeraient d'environ {formatNumber(result.co2BeforeKg / 1000, 1)} t à{' '}
            {formatNumber((result.co2BeforeKg - result.co2SavedKg) / 1000, 1)} t de CO₂ par an, soit{' '}
            <strong>−{co2Pct} %</strong>.
            {usesPac &&
              (input.heating === 'fioul' || input.heating === 'gaz') &&
              ` L'essentiel de la baisse vient de l'abandon du ${heatingName} au profit de l'électricité, peu carbonée en France.`}
          </p>
        </Section>

        {/* Hypothèses repliées par défaut */}
        <details className="report__block report__assumptions">
          <summary>5. Hypothèses de calcul</summary>
          <ul className="report__list">
            <li>
              Consommation de référence : {kwhM2Period} kWh/m²/an pour un logement construit{' '}
              {PERIODS[input.period].label.toLowerCase()}, climat moyen, 20 °C
              {isFlat && ` ; ${HOUSING.appartement.label.toLowerCase()} : × 0,8`}.
            </li>
            {dept && (
              <li>
                Zone climatique {dept.zone} : coefficient × {formatNumber(factors.climate, 2)}, d'après les écarts entre
                zones des fiches CEE (H1 : 1 700, H2 : 1 400, H3 : 900 kWh cumac par m² isolé).
              </li>
            )}
            <li>
              Température : environ {Math.round(PER_DEGREE * 100)} % de consommation par degré au-dessus ou en dessous
              de 20 °C.
            </li>
            <li>
              {heat.label} : {formatNumber(heat.price, 3)} €/kWh et {formatNumber(heat.co2, 3)} kg CO₂/kWh.
            </li>
            {usesPac && (
              <li>
                Pompe à chaleur : rendement de {formatNumber(factors.cop, 1)} en zone {dept?.zone || 'moyenne'},
                électricité à {formatNumber(elec.price, 2)} €/kWh et {formatNumber(elec.co2, 3)} kg CO₂/kWh.
              </li>
            )}
            <li>Gains : combles −25 %, murs −20 %, fenêtres −10 %, ventilation −7 %, appliqués successivement.</li>
            <li>Non pris en compte : eau chaude, coût des travaux, aides financières, évolution des prix.</li>
          </ul>
        </details>

        <Section title="6. Prochaines étapes">
          <ol className="report__list">
            <li>Un audit énergétique, pour chiffrer précisément vos pertes et l'ordre des travaux.</li>
            <li>Des devis auprès d'artisans certifiés RGE, condition pour la plupart des aides.</li>
            <li>Un rendez-vous avec un conseiller France Rénov', service public gratuit, pour le financement.</li>
          </ol>
        </Section>
      </div>
    </section>
  )
}
