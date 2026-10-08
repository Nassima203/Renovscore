/**
 * Moteur d'estimation — volontairement simple et transparent.
 * Toutes les valeurs sont des ordres de grandeur INDICATIFS (hypothèses
 * détaillées dans le README). Ce n'est ni un DPE ni un audit énergétique.
 */
import { DEPARTMENTS } from './departments.js'

// Consommation de chauffage moyenne (kWh / m² / an) selon l'époque de construction,
// pour un climat moyen français et une température intérieure de 20 °C.
export const PERIODS = {
  'avant-1975': { label: 'Avant 1975', kwhM2: 330 },
  '1975-1999': { label: '1975 – 1999', kwhM2: 220 },
  '2000-2012': { label: '2000 – 2012', kwhM2: 150 },
  'apres-2012': { label: 'Après 2012', kwhM2: 90 },
}

export const HOUSING = {
  maison: { label: 'Maison', factor: 1 },
  appartement: { label: 'Appartement', factor: 0.8 },
}

// Zones climatiques : coefficient appliqué aux besoins de chauffage.
// Proportions tirées des fiches CEE BAR-EN-101 (1 700 / 1 400 / 900 kWh cumac par m² isolé
// en H1 / H2 / H3), ramenées autour de la moyenne nationale.
// Le rendement d'une pompe à chaleur (COP) baisse quand il fait plus froid.
export const ZONES = {
  H1: { label: 'H1 — climat froid (Nord, Est, Île-de-France, montagne)', factor: 1.1, cop: 2.7 },
  H2: { label: 'H2 — climat tempéré (Ouest, Sud-Ouest, Centre)', factor: 0.9, cop: 3 },
  H3: { label: 'H3 — climat méditerranéen', factor: 0.58, cop: 3.3 },
}

// Température de chauffe : environ 7 % de consommation en plus par degré au-dessus de 20 °C
// (et en moins en dessous), ordre de grandeur couramment retenu par l'ADEME.
export const TEMPERATURES = [18, 19, 20, 21, 22, 23]
const PER_DEGREE = 0.07
const tempFactor = (t) => 1 + PER_DEGREE * (t - 20)

// Prix (€/kWh) et émissions (kg CO₂/kWh) — ordres de grandeur
export const HEATING = {
  fioul: { label: 'Fioul', price: 0.12, co2: 0.324 },
  gaz: { label: 'Gaz', price: 0.11, co2: 0.227 },
  electrique: { label: 'Électrique (radiateurs)', price: 0.25, co2: 0.079 },
  bois: { label: 'Bois / granulés', price: 0.08, co2: 0.03 },
}

// Part des besoins de chauffage économisée par chaque type de travaux
export const WORKS = {
  combles: { label: 'Isolation des combles', icon: '🏠', saving: 0.25 },
  murs: { label: 'Isolation des murs', icon: '🧱', saving: 0.2 },
  fenetres: { label: 'Fenêtres double vitrage', icon: '🪟', saving: 0.1 },
  vmc: { label: 'Ventilation (VMC)', icon: '🌬️', saving: 0.07 },
  pac: { label: 'Pompe à chaleur', icon: '♨️', saving: 0 },
}
// Travaux qu'on peut déclarer « déjà réalisés »
export const INSULATION_KEYS = ['combles', 'murs', 'fenetres', 'vmc']

const LABELS = [
  { max: 70, letter: 'A' },
  { max: 110, letter: 'B' },
  { max: 180, letter: 'C' },
  { max: 250, letter: 'D' },
  { max: 330, letter: 'E' },
  { max: 420, letter: 'F' },
  { max: Infinity, letter: 'G' },
]

export const labelFor = (kwhM2) => LABELS.find((l) => kwhM2 <= l.max).letter
export const LABEL_THRESHOLDS = LABELS

const round = (n, step = 10) => Math.round(n / step) * step

export function estimate({
  housing,
  period,
  surface,
  heating,
  works = [],
  department,
  temperature = 20,
  alreadyDone = [],
}) {
  const s = Number(surface)
  const t = Number(temperature)
  const dept = department ? DEPARTMENTS[department] : null
  if (
    !HOUSING[housing] ||
    !PERIODS[period] ||
    !HEATING[heating] ||
    !(s > 0) ||
    !(t >= 16 && t <= 25) ||
    (department && !dept)
  ) {
    throw new Error('Paramètres invalides')
  }

  const zone = dept ? ZONES[dept.zone] : null
  const climate = zone ? zone.factor : 1
  const cop = zone ? zone.cop : 3
  const done = alreadyDone.filter((w) => INSULATION_KEYS.includes(w))
  const todo = works.filter((w) => WORKS[w] && !done.includes(w))

  // 1. Besoins de chauffage actuels
  const reference = PERIODS[period].kwhM2 * HOUSING[housing].factor * s // logement « moyen » de l'époque
  const afterClimate = reference * climate
  const afterTemp = afterClimate * tempFactor(t)
  const doneFactor = done.reduce((acc, w) => acc * (1 - WORKS[w].saving), 1)
  const needBefore = afterTemp * doneFactor

  // 2. Après travaux : les gains se cumulent de façon multiplicative
  const remaining = todo.reduce((acc, w) => acc * (1 - WORKS[w].saving), 1)
  const needAfter = needBefore * remaining

  const usesPac = todo.includes('pac')
  const heat = HEATING[heating]
  const elec = HEATING.electrique
  const energyAfter = usesPac ? needAfter / cop : needAfter
  const priceAfter = usesPac ? elec.price : heat.price
  const co2After = usesPac ? elec.co2 : heat.co2

  const costBefore = needBefore * heat.price
  const costAfter = energyAfter * priceAfter
  const co2Before = needBefore * heat.co2
  const co2Saved = co2Before - energyAfter * co2After

  // 3. Détail poste par poste : l'isolation d'abord (chaque gain s'applique
  // à ce qui reste), puis le changement de chauffage.
  const breakdown = []
  let need = needBefore
  for (const key of INSULATION_KEYS) {
    if (!todo.includes(key)) continue
    const savedKwh = need * WORKS[key].saving
    need -= savedKwh
    breakdown.push({ key, kwhSaved: round(savedKwh, 100), euroSaved: round(savedKwh * heat.price) })
  }
  if (usesPac) {
    const euro = needAfter * heat.price - (needAfter / cop) * elec.price
    breakdown.push({ key: 'pac', kwhSaved: round(needAfter - needAfter / cop, 100), euroSaved: round(euro) })
  }

  return {
    kwhBefore: round(needBefore, 100),
    kwhAfter: round(energyAfter, 100),
    costBefore: round(costBefore),
    costAfter: round(costAfter),
    yearlySaving: round(Math.max(0, costBefore - costAfter)),
    savingPct: Math.max(0, Math.round((1 - costAfter / costBefore) * 100)),
    co2SavedKg: round(Math.max(0, co2Saved)),
    co2BeforeKg: round(co2Before),
    labelBefore: labelFor(needBefore / s),
    labelAfter: labelFor(energyAfter / s),
    kwhM2Before: Math.round(needBefore / s),
    kwhM2After: Math.round(energyAfter / s),
    works: todo,
    breakdown,
    // Comment on passe du logement « moyen » au vôtre (kWh/an)
    steps: {
      reference: round(reference, 100),
      climate: round(afterClimate, 100),
      temperature: round(afterTemp, 100),
      alreadyDone: round(needBefore, 100),
    },
    assumptions: {
      kwhM2Period: PERIODS[period].kwhM2,
      housingFactor: HOUSING[housing].factor,
      zone: dept ? dept.zone : null,
      climateFactor: climate,
      tempFactor: tempFactor(t),
      perDegree: PER_DEGREE,
      price: heat.price,
      co2: heat.co2,
      elecPrice: elec.price,
      elecCo2: elec.co2,
      cop,
    },
  }
}
