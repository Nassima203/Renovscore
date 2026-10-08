import { useEffect, useMemo, useState } from 'react'
import DemoBanner from './DemoBanner.jsx'
import Footer from './Footer.jsx'
import { upcomingDays, calendarLinks, dayLabel, timeLabel, isBookable, DURATION_MIN } from '../lib/slots.js'

const PHONE_RE = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const longLabel = (slot) =>
  `${dayLabel(slot.slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long' })} à ${timeLabel(slot)}`

// Créneaux calculés dans le navigateur, si le serveur ne répond pas (mode démo)
const localDays = () =>
  upcomingDays().map((d) => ({ date: d.date, slots: d.slots.map((s) => ({ slot: s, free: true })) }))

export default function Booking() {
  const params = new URLSearchParams(window.location.search)
  const leadId = params.get('demande')
  const wanted = params.get('creneau')

  const [days, setDays] = useState(null)
  const [demo, setDemo] = useState(false)
  const [date, setDate] = useState(null)
  const [slot, setSlot] = useState(wanted && isBookable(wanted) ? wanted : null)
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [needContact, setNeedContact] = useState(!leadId)
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [error, setError] = useState('')
  const [booked, setBooked] = useState(null) // { slot, firstName }

  const load = async () => {
    try {
      const res = await fetch('/api/slots')
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setDays(data.days)
      setDemo(false)
      return data.days
    } catch {
      const d = localDays()
      setDays(d)
      setDemo(true)
      return d
    }
  }

  useEffect(() => {
    load().then((d) => {
      const fromLink = wanted && d.find((x) => x.date === wanted.slice(0, 10))
      const firstFree = d.find((x) => x.slots.some((s) => s.free))
      setDate((fromLink || firstFree || d[0])?.date ?? null)
      // Si le créneau du lien est déjà pris, on ne le présélectionne pas
      if (wanted && !d.some((x) => x.slots.some((s) => s.slot === wanted && s.free))) setSlot(null)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = useMemo(() => days?.find((d) => d.date === date), [days, date])

  const submit = async () => {
    setError('')
    if (!slot) return setError('Choisissez un créneau.')
    if (needContact) {
      if (contact.name.trim().length < 2) return setError('Indiquez votre nom.')
      if (!PHONE_RE.test(contact.phone.trim())) return setError('Indiquez un numéro de téléphone valide.')
      if (contact.email && !EMAIL_RE.test(contact.email.trim())) return setError('Adresse e-mail invalide.')
    }
    setStatus('sending')
    const body = needContact ? { slot, ...contact } : { slot, leadId }
    let res
    try {
      res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch {
      res = null
    }
    if (!res || res.status === 404) {
      // Mode démo (pas de serveur) : on confirme sans enregistrer
      setBooked({ slot, firstName: (contact.name || '').split(' ')[0], demo: true })
      return setStatus('done')
    }
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setBooked({ slot, firstName: data.firstName })
      return setStatus('done')
    }
    setStatus('idle')
    if (data.needPhone) setNeedContact(true)
    if (res.status === 409) {
      setSlot(null)
      load()
    }
    setError(data.error || 'Une erreur est survenue, merci de réessayer.')
  }

  return (
    <>
      <DemoBanner />
      <header className="topbar">
        <div className="container topbar__inner">
          <a href="/" className="logo" aria-label="Rénov'Score, accueil">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            Rénov'Score
          </a>
          <a className="btn btn--small btn--ghost" href="/">
            Refaire une simulation
          </a>
        </div>
      </header>

      <main className="section">
        <div className="container narrow">
          {status !== 'done' ? (
            <>
              <p className="eyebrow">Rendez-vous téléphonique</p>
              <h1 className="booking__title">Choisissez votre créneau d'appel</h1>
              <p className="muted booking__intro">
                Un conseiller vous appelle pendant {DURATION_MIN} minutes pour affiner votre estimation et vous
                présenter les aides possibles. C'est gratuit et sans engagement.
              </p>

              <div className="card">
                <div className="card__body">
                  <p className="field-label" style={{ marginTop: 0 }}>
                    1. Le jour
                  </p>
                  {!days ? (
                    <p className="muted">Chargement des disponibilités…</p>
                  ) : (
                    <div className="days" role="tablist" aria-label="Jours disponibles">
                      {days.map((d) => {
                        const free = d.slots.filter((s) => s.free).length
                        const [wd, dd, mm] = dayLabel(d.date).replace('.', '').split(' ')
                        return (
                          <button
                            key={d.date}
                            role="tab"
                            aria-selected={d.date === date}
                            className={`day ${d.date === date ? 'is-active' : ''}`}
                            disabled={free === 0}
                            onClick={() => setDate(d.date)}
                          >
                            <span className="day__wd">{wd}</span>
                            <span className="day__num">{dd}</span>
                            <span className="day__mm">{mm}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {current && (
                    <>
                      <p className="field-label">2. L'heure</p>
                      <div className="slots">
                        {current.slots.map((s) => (
                          <button
                            key={s.slot}
                            className={`slot ${s.slot === slot ? 'is-active' : ''}`}
                            disabled={!s.free}
                            aria-pressed={s.slot === slot}
                            onClick={() => setSlot(s.slot)}
                            title={s.free ? '' : 'Créneau déjà réservé'}
                          >
                            {timeLabel(s.slot)}
                          </button>
                        ))}
                      </div>
                      <p className="field-hint">Heures de Paris. Les créneaux grisés sont déjà réservés.</p>
                    </>
                  )}

                  {needContact && (
                    <>
                      <p className="field-label">3. Vos coordonnées</p>
                      <div className="form-grid">
                        <div className="field">
                          <label htmlFor="b-name">Nom complet</label>
                          <input
                            id="b-name"
                            autoComplete="name"
                            value={contact.name}
                            onChange={(e) => setContact({ ...contact, name: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="b-phone">Téléphone</label>
                          <input
                            id="b-phone"
                            type="tel"
                            autoComplete="tel"
                            value={contact.phone}
                            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="b-email">E-mail (facultatif)</label>
                          <input
                            id="b-email"
                            type="email"
                            autoComplete="email"
                            value={contact.email}
                            onChange={(e) => setContact({ ...contact, email: e.target.value })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className={`booking__summary ${slot ? 'is-ready' : ''}`}>
                    {slot ? (
                      <>
                        <span className="muted small">Votre créneau</span>
                        <strong>
                          {longLabel(slot)} · {DURATION_MIN} min
                        </strong>
                      </>
                    ) : (
                      <span className="muted">Sélectionnez un horaire ci-dessus.</span>
                    )}
                  </div>

                  {error && (
                    <p className="error" role="alert">
                      {error}
                    </p>
                  )}

                  <button className="btn btn--full" disabled={!slot || status === 'sending'} onClick={submit}>
                    {status === 'sending' ? 'Réservation…' : 'Valider ce créneau'}
                  </button>
                  {demo && (
                    <p className="muted small center" style={{ marginTop: 10 }}>
                      Mode démo : aucune réservation n'est enregistrée.
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <Confirmation booked={booked} />
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function Confirmation({ booked }) {
  const links = calendarLinks(booked.slot, window.location.origin)
  const [y, m, d] = booked.slot.slice(0, 10).split('-')
  const month = dayLabel(booked.slot.slice(0, 10), { month: 'short' }).replace('.', '')
  const weekday = dayLabel(booked.slot.slice(0, 10), { weekday: 'long' })
  return (
    <>
      <p className="eyebrow">✓ Rendez-vous confirmé</p>
      <h1 className="booking__title">C'est noté{booked.firstName ? `, ${booked.firstName}` : ''} : on vous appelle {weekday}</h1>
      <p className="muted booking__intro">
        Votre créneau est réservé. Ajoutez-le à votre agenda pour ne pas l'oublier.
      </p>

      <div className="card">
        <div className="card__body">
          <div className="appt">
            <div className="appt__date" aria-hidden="true">
              <span className="appt__month">{month}</span>
              <span className="appt__day">{Number(d)}</span>
              <span className="appt__wd">{weekday}</span>
            </div>
            <div>
              <p className="appt__time">
                {timeLabel(booked.slot)} – {timeLabel(`${y}-${m}-${d}T` + endTime(booked.slot))}
              </p>
              <p className="muted">Appel téléphonique avec un conseiller rénovation · {DURATION_MIN} min · gratuit</p>
            </div>
          </div>

          <h2 className="booking__h2">Ajouter à mon calendrier</h2>
          <div className="cal-links">
            <a className="btn" href={links.google} target="_blank" rel="noreferrer">
              Google Agenda
            </a>
            <a className="btn" href={links.outlook} target="_blank" rel="noreferrer">
              Outlook
            </a>
            <a className="btn btn--ghost" href={links.ics}>
              Apple / autre (.ics)
            </a>
          </div>

          <h2 className="booking__h2">Pour préparer l'appel</h2>
          <ul className="report__list">
            <li>Une facture d'énergie récente (gaz, électricité ou fioul)</li>
            <li>Votre DPE si vous en avez un</li>
            <li>Vos questions sur les travaux ou le financement</li>
          </ul>

          {booked.demo && (
            <p className="tip">Mode démo : ce rendez-vous n'a pas été enregistré.</p>
          )}
          <p className="small muted" style={{ marginTop: 20 }}>
            Un empêchement ? <a href={`/rdv${window.location.search}`}>Choisir un autre créneau</a>
          </p>
        </div>
      </div>
    </>
  )
}

function endTime(slot) {
  const [h, mi] = slot.slice(11).split(':').map(Number)
  const total = h * 60 + mi + DURATION_MIN
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
