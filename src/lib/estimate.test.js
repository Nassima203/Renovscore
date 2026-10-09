import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimate, labelFor } from './estimate.js'

// Logement de base commun à la plupart des tests

const base = { housing: 'maison', period: 'avant-1975', surface: 100, heating: 'fioul' }

test('sans travaux, aucune économie', () => {
  const r = estimate({ ...base, works: [] })
  assert.equal(r.yearlySaving, 0)
  assert.equal(r.kwhBefore, r.kwhAfter)
})

test('les gains se cumulent sans dépasser 100 %', () => {
  const r = estimate({ ...base, works: ['combles', 'murs', 'fenetres', 'vmc'] })
  assert.ok(r.savingPct > 40 && r.savingPct < 100)
})

test('une pompe à chaleur réduit fortement la facture fioul', () => {
  const r = estimate({ ...base, works: ['pac'] })
  assert.ok(r.costAfter < r.costBefore)
  assert.ok(r.co2SavedKg > 0)
})

test("l'étiquette s'améliore après isolation", () => {
  const r = estimate({ ...base, works: ['combles', 'murs'] })
  assert.ok(r.labelAfter < r.labelBefore) // ordre alphabétique : A meilleure que G
})

test('paramètres invalides → erreur', () => {
  assert.throws(() => estimate({ ...base, surface: 0 }))
  assert.throws(() => estimate({ ...base, heating: 'charbon' }))
})

test('le détail poste par poste retombe sur le total', () => {
  for (const heating of ['fioul', 'gaz', 'electrique', 'bois']) {
    const r = estimate({ ...base, heating, works: ['combles', 'murs', 'fenetres', 'vmc', 'pac'] })
    const sum = r.breakdown.reduce((a, b) => a + b.euroSaved, 0)
    assert.ok(Math.abs(sum - (r.costBefore - r.costAfter)) <= 30, `${heating}: ${sum}`)
  }
})

test('le climat change la consommation : Nord > Bretagne > Hérault', () => {
  const nord = estimate({ ...base, department: '59', works: ['combles'] })
  const bretagne = estimate({ ...base, department: '35', works: ['combles'] })
  const herault = estimate({ ...base, department: '34', works: ['combles'] })
  assert.ok(nord.kwhBefore > bretagne.kwhBefore && bretagne.kwhBefore > herault.kwhBefore)
})

test('chauffer plus fort consomme plus', () => {
  const a = estimate({ ...base, temperature: 19, works: ['combles'] })
  const b = estimate({ ...base, temperature: 22, works: ['combles'] })
  assert.ok(b.costBefore > a.costBefore)
})

test('des travaux déjà réalisés ne sont pas comptés deux fois', () => {
  const r = estimate({ ...base, alreadyDone: ['combles'], works: ['combles', 'murs'] })
  assert.deepEqual(r.works, ['murs'])
  assert.ok(r.kwhBefore < estimate({ ...base, works: ['murs'] }).kwhBefore)
})

test('département inconnu → erreur', () => {
  assert.throws(() => estimate({ ...base, department: '999' }))
})

test('seuils des étiquettes', () => {
  assert.equal(labelFor(60), 'A')
  assert.equal(labelFor(500), 'G')
})

test('un logement RE 2020 consomme moins qu’un logement RT 2012', () => {
  const rt = estimate({ ...base, period: '2012-2021', works: ['vmc'] })
  const re = estimate({ ...base, period: 'apres-2022', works: ['vmc'] })
  assert.ok(re.kwhBefore < rt.kwhBefore)
})
