/**
 * Moteur d'estimation des économies de chauffage.
 * Valeurs indicatives (ordres de grandeur) : ni DPE, ni audit énergétique.
 */
import { DEPARTMENTS } from './departments.js'

// Consommation de chauffage de référence (kWh/m²/an) par époque de construction,
// pour un climat moyen et 20 °C à l'intérieur
export const PERIODS = {
  'avant-1975': { label: 'Avant 1975', kwhM2: 330 },
  '1975-1999': { label: '1975 – 1999', kwhM2: 220 },
  '2000-2012': { label: '2000 – 2012', kwhM2: 150 },
  '2012-2021': { label: '2012 – 2021', kwhM2: 90 }, // réglementation thermique RT 2012
  'apres-2022': { label: 'Depuis 2022', kwhM2: 55 }, // réglementation environnementale RE 2020
}

// Coefficient selon le type de logement (moins de murs extérieurs en appartement)
export const HOUSING = {
  maison: { label: 'Maison', factor: 1 },
  appartement: { label: 'Appartement', factor: 0.8 },
}

// Zones climatiques : coefficient sur les besoins de chauffage et rendement (COP) de la pompe à chaleur.
// Écarts tirés des fiches CEE BAR-EN-101 : 1 700 / 1 400 / 900 kWh cumac par m² isolé.
export const ZONES = {
  H1: { name: 'climat froid (Nord, Est, Île-de-France, montagne)', factor: 1.1, cop: 2.7 },
  H2: { name: 'climat tempéré (Ouest, Sud-Ouest, Centre)', factor: 0.9, cop: 3 },
  H3: { name: 'climat méditerranéen', factor: 0.58, cop: 3.3 },
}
const DEFAULT_COP = 3

// Températures proposées et effet d'un degré de plus ou de moins (environ 7 %, ordre de grandeur ADEME)
export const TEMPERATURES = [18, 19, 20, 21, 22, 23]
export const PER_DEGREE = 0.07
const temperatureFactor = (temp) => 1 + PER_DEGREE * (temp - 20)

// Prix moyen (€/kWh) et émissions (kg CO₂/kWh) par énergie
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
  pac: { label: 'Pompe à chaleur', icon: '♨️', saving: 0 }, // gain calculé à part (COP)
}

// Travaux d'isolation, déclarables comme « déjà réalisés »
export const INSULATION_KEYS = ['combles', 'murs', 'fenetres', 'vmc']

// Seuils des étiquettes énergie (kWh de chauffage par m² et par an)
export const LABELS = [
  { letter: 'A', max: 70 },
  { letter: 'B', max: 110 },
  { letter: 'C', max: 180 },
  { letter: 'D', max: 250 },
  { letter: 'E', max: 330 },
  { letter: 'F', max: 420 },
  { letter: 'G', max: Infinity },
]

export const labelFor = (kwhM2) => LABELS.find((label) => kwhM2 <= label.max).letter

// Arrondi au pas voulu : 10 € ou 100 kWh
const round = (value, step = 10) => Math.round(value / step) * step

// Part des besoins restante après une liste de travaux (gains cumulés, et non additionnés)
const remainingShare = (keys) => keys.reduce((share, key) => share * (1 - WORKS[key].saving), 1)

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
  const area = Number(surface)
  const temp = Number(temperature)
  const dept = department ? DEPARTMENTS[department] : null

  // Vérification des paramètres
  const isValid =
    HOUSING[housing] &&
    PERIODS[period] &&
    HEATING[heating] &&
    area > 0 &&
    temp >= 16 &&
    temp <= 25 &&
    (!department || dept)
  if (!isValid) throw new Error('Paramètres invalides')

  const zone = dept ? ZONES[dept.zone] : null
  const climate = zone ? zone.factor : 1
  const cop = zone ? zone.cop : DEFAULT_COP
  const done = alreadyDone.filter((key) => INSULATION_KEYS.includes(key))
  const todo = works.filter((key) => WORKS[key] && !done.includes(key))

  // 1. Besoins actuels : référence → climat → température → travaux déjà réalisés
  const reference = PERIODS[period].kwhM2 * HOUSING[housing].factor * area
  const withClimate = reference * climate
  const withTemperature = withClimate * temperatureFactor(temp)
  const needBefore = withTemperature * remainingShare(done)

  // 2. Besoins après travaux
  const needAfter = needBefore * remainingShare(todo)

  // 3. Énergie consommée : avec une pompe à chaleur, passage à l'électricité et division par le COP
  const heat = HEATING[heating]
  const elec = HEATING.electrique
  const usesPac = todo.includes('pac')
  const energyAfter = usesPac ? needAfter / cop : needAfter
  const energyType = usesPac ? elec : heat

  // 4. Coûts (€/an) et émissions (kg CO₂/an)
  const costBefore = needBefore * heat.price
  const costAfter = energyAfter * energyType.price
  const co2Before = needBefore * heat.co2
  const co2After = energyAfter * energyType.co2

  // 5. Détail par chantier : isolation d'abord (chaque gain sur ce qui reste), pompe à chaleur en dernier
  const breakdown = []
  let need = needBefore
  for (const key of INSULATION_KEYS.filter((k) => todo.includes(k))) {
    const kwhSaved = need * WORKS[key].saving
    need -= kwhSaved
    breakdown.push({ key, kwhSaved: round(kwhSaved, 100), euroSaved: round(kwhSaved * heat.price) })
  }
  if (usesPac) {
    breakdown.push({
      key: 'pac',
      kwhSaved: round(needAfter - energyAfter, 100),
      euroSaved: round(needAfter * heat.price - energyAfter * elec.price),
    })
  }

  return {
    works: todo,

    // Consommation et étiquette énergie
    kwhBefore: round(needBefore, 100),
    kwhAfter: round(energyAfter, 100),
    kwhM2Before: Math.round(needBefore / area),
    kwhM2After: Math.round(energyAfter / area),
    labelBefore: labelFor(needBefore / area),
    labelAfter: labelFor(energyAfter / area),

    // Facture de chauffage
    costBefore: round(costBefore),
    costAfter: round(costAfter),
    yearlySaving: round(Math.max(0, costBefore - costAfter)),
    savingPct: Math.max(0, Math.round((1 - costAfter / costBefore) * 100)),

    // Émissions de CO₂
    co2BeforeKg: round(co2Before),
    co2SavedKg: round(Math.max(0, co2Before - co2After)),

    // Détails pour le rapport
    breakdown,
    steps: {
      reference: round(reference, 100),
      climate: round(withClimate, 100),
      temperature: round(withTemperature, 100),
      alreadyDone: round(needBefore, 100),
    },
    factors: { climate, temperature: temperatureFactor(temp), cop },
  }
}
