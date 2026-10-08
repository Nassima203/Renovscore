import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slotToDate, upcomingDays, isBookable, icsContent, calendarLinks } from './slots.js'

test("l'heure de Paris est convertie en UTC (été et hiver)", () => {
  assert.equal(slotToDate('2026-07-01T10:30').toISOString(), '2026-07-01T08:30:00.000Z')
  assert.equal(slotToDate('2026-12-01T10:30').toISOString(), '2026-12-01T09:30:00.000Z')
  assert.equal(slotToDate('pas-un-creneau'), null)
})

test('pas de créneau le week-end ni dans moins de 2 h', () => {
  const now = new Date('2026-10-09T15:00:00Z') // vendredi 17 h à Paris
  const days = upcomingDays(now)
  for (const d of days) {
    const wd = new Date(`${d.date}T12:00:00Z`).getUTCDay()
    assert.ok(wd !== 0 && wd !== 6, d.date)
  }
  assert.ok(!isBookable('2026-10-09T17:30', now)) // dans 30 min
  assert.ok(!isBookable('2026-10-10T10:00', now)) // samedi
  assert.ok(isBookable('2026-10-12T10:00', now)) // lundi
  assert.ok(!isBookable('2026-10-12T12:30', now)) // pause déjeuner
})

test('le fichier .ics et les liens sont corrects', () => {
  const ics = icsContent('2026-10-13T10:30')
  assert.match(ics, /DTSTART:20261013T083000Z/)
  assert.match(ics, /DTEND:20261013T084500Z/)
  assert.match(calendarLinks('2026-10-13T10:30').google, /dates=20261013T083000Z%2F20261013T084500Z/)
})
