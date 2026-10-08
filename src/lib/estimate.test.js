import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estimate, labelFor } from './estimate.js'

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
  assert.ok(r.labelAfter < r.labelBefore) // 'D' < 'E' alphabétiquement
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

test('seuils des étiquettes', () => {
  assert.equal(labelFor(60), 'A')
  assert.equal(labelFor(500), 'G')
})
