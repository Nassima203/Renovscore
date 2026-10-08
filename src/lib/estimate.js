/**
 * Moteur d'estimation — volontairement simple et transparent.
 * Toutes les valeurs sont des ordres de grandeur INDICATIFS (hypothèses
 * détaillées dans le README). Ce n'est ni un DPE ni un audit énergétique.
 */

// Consommation de chauffage moyenne (kWh / m² / an) selon l'époque de construction
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

// Prix (€/kWh) et émissions (kg CO₂/kWh) — ordres de grandeur
export const HEATING = {
  fioul: { label: 'Fioul', price: 0.12, co2: 0.324 },
  gaz: { label: 'Gaz', price: 0.11, co2: 0.227 },
  electrique: { label: 'Électrique (radiateurs)', price: 0.25, co2: 0.079 },
  bois: { label: 'Bois / granulés', price: 0.08, co2: 0.03 },
}

// Part de la consommation économisée par chaque type de travaux
export const WORKS = {
  combles: { label: 'Isolation des combles', icon: '🏠', saving: 0.25 },
  murs: { label: 'Isolation des murs', icon: '🧱', saving: 0.2 },
  fenetres: { label: 'Fenêtres double vitrage', icon: '🪟', saving: 0.1 },
  vmc: { label: 'Ventilation (VMC)', icon: '🌬️', saving: 0.07 },
  pac: { label: 'Pompe à chaleur', icon: '♨️', saving: 0 },
}

const PAC_COP = 3 // 1 kWh électrique → ~3 kWh de chaleur

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

const round = (n, step = 10) => Math.round(n / step) * step

export function estimate({ housing, period, surface, heating, works = [] }) {
  const s = Number(surface)
  if (!HOUSING[housing] || !PERIODS[period] || !HEATING[heating] || !(s > 0)) {
    throw new Error('Paramètres invalides')
  }

  const needBefore = PERIODS[period].kwhM2 * HOUSING[housing].factor * s
  const heat = HEATING[heating]

  // Les gains d'isolation se cumulent de façon multiplicative (pas d'addition naïve)
  const remaining = works
    .filter((w) => WORKS[w])
    .reduce((acc, w) => acc * (1 - WORKS[w].saving), 1)
  const needAfter = needBefore * remaining

  const usesPac = works.includes('pac')
  const elec = HEATING.electrique
  const energyAfter = usesPac ? needAfter / PAC_COP : needAfter
  const priceAfter = usesPac ? elec.price : heat.price
  const co2After = usesPac ? elec.co2 : heat.co2

  const costBefore = needBefore * heat.price
  const costAfter = energyAfter * priceAfter
  const co2Before = needBefore * heat.co2
  const co2Saved = co2Before - energyAfter * co2After

  return {
    kwhBefore: round(needBefore, 100),
    kwhAfter: round(energyAfter, 100),
    costBefore: round(costBefore),
    costAfter: round(costAfter),
    yearlySaving: round(Math.max(0, costBefore - costAfter)),
    savingPct: Math.max(0, Math.round((1 - costAfter / costBefore) * 100)),
    co2SavedKg: round(Math.max(0, co2Saved)),
    labelBefore: labelFor(needBefore / s),
    labelAfter: labelFor(energyAfter / s),
  }
}
