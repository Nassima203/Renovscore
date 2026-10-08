// Créneaux d'appel : du lundi au vendredi, 9h–18h (pause 12h30–13h30), toutes les 30 min,
// en heure de Paris. Partagé entre la page de réservation et les fonctions serveur.
export const TZ = 'Europe/Paris'
export const DURATION_MIN = 15
export const TIMES = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
]
const MIN_NOTICE_MS = 2 * 60 * 60 * 1000 // au moins 2 h à l'avance
const SLOT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

// Décalage (en minutes) entre Paris et UTC à un instant donné (+60 l'hiver, +120 l'été)
function parisOffsetMinutes(date) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName').value // ex. "GMT+2"
  const m = part.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0))
}

// "2026-10-13T10:30" (heure de Paris) → Date (instant UTC)
export function slotToDate(slot) {
  const m = SLOT_RE.exec(slot)
  if (!m) return null
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  return new Date(guess - parisOffsetMinutes(new Date(guess)) * 60000)
}

// Date du jour à Paris, au format YYYY-MM-DD
function parisToday(now) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now)
}

// Liste des prochains jours ouvrés avec leurs créneaux encore réservables
export function upcomingDays(now = new Date(), count = 10) {
  const [y, mo, d] = parisToday(now).split('-').map(Number)
  const days = []
  for (let i = 0; days.length < count && i < 30; i++) {
    const day = new Date(Date.UTC(y, mo - 1, d + i))
    const weekday = day.getUTCDay()
    if (weekday === 0 || weekday === 6) continue
    const date = day.toISOString().slice(0, 10)
    const slots = TIMES.map((t) => `${date}T${t}`).filter(
      (s) => slotToDate(s).getTime() - now.getTime() >= MIN_NOTICE_MS,
    )
    if (slots.length) days.push({ date, slots })
  }
  return days
}

export function isBookable(slot, now = new Date()) {
  return upcomingDays(now).some((d) => d.slots.includes(slot))
}

// --- Liens « Ajouter à mon calendrier » ---
const TITLE = "Appel conseiller Rénov'Score"
const DETAILS = 'Appel de 15 minutes pour affiner votre estimation de rénovation énergétique.'
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function calendarLinks(slot, origin = '') {
  const start = slotToDate(slot)
  const end = new Date(start.getTime() + DURATION_MIN * 60000)
  const q = (o) => new URLSearchParams(o).toString()
  return {
    google: `https://calendar.google.com/calendar/render?${q({
      action: 'TEMPLATE',
      text: TITLE,
      dates: `${stamp(start)}/${stamp(end)}`,
      details: DETAILS,
    })}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?${q({
      subject: TITLE,
      startdt: start.toISOString(),
      enddt: end.toISOString(),
      body: DETAILS,
    })}`,
    ics: `${origin}/api/ics?${q({ creneau: slot })}`,
  }
}

export function icsContent(slot) {
  const start = slotToDate(slot)
  const end = new Date(start.getTime() + DURATION_MIN * 60000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    "PRODID:-//Rénov'Score//RDV//FR",
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${slot}@renovscore`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${TITLE}`,
    `DESCRIPTION:${DETAILS}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${TITLE}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

// Libellés en français
export const dayLabel = (date, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('fr-FR', { ...opts, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
export const timeLabel = (slot) => slot.slice(11).replace(':', 'h')
