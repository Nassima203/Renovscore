import { useState } from 'react'
import { saveLead } from '../lib/api.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/

export default function LeadForm({ simulation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', postal_code: '', website: '', consent: false })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errors, setErrors] = useState({})
  const [demo, setDemo] = useState(false)
  const [leadId, setLeadId] = useState(null)

  const update = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    const err = {}
    if (form.name.trim().length < 2) err.name = 'Indiquez votre nom.'
    if (!EMAIL_RE.test(form.email)) err.email = 'Adresse e-mail invalide.'
    if (!PHONE_RE.test(form.phone.trim())) err.phone = 'Indiquez un numéro pour être rappelé·e.'
    if (!/^\d{5}$/.test(form.postal_code)) err.postal_code = 'Code postal à 5 chiffres.'
    if (!form.consent) err.consent = 'Votre accord est nécessaire pour être recontacté.'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setStatus('sending')
    try {
      const { consent, ...contact } = form
      const res = await saveLead({
        ...contact,
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        housing: simulation.input.housing,
        period: simulation.input.period,
        surface: Number(simulation.input.surface),
        heating: simulation.input.heating,
        works: simulation.result.works,
        department: simulation.input.department,
        temperature: simulation.input.temperature,
        alreadyDone: simulation.input.alreadyDone,
      })
      setDemo(res.demo)
      setLeadId(res.id || null)
      setStatus('sent')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'sent') {
    const rdvUrl = leadId ? `/rdv?demande=${leadId}` : '/rdv'
    return (
      <div className="card success">
        <div className="card__body">
          <p className="eyebrow">Demande reçue</p>
          <h2>Merci {form.name.split(' ')[0]}, plus qu'une étape</h2>
          <p>
            Choisissez maintenant le moment où un conseiller vous appelle : 15 minutes, gratuit et sans engagement.
          </p>
          <a className="btn" href={rdvUrl}>
            Choisir mon créneau d'appel →
          </a>
          {demo && (
            <p className="muted small" style={{ marginTop: 16 }}>
              (Mode démo : la demande est stockée dans votre navigateur. En ligne, elle est enregistrée dans Supabase
              via une fonction serveur.)
            </p>
          )}
        </div>
      </div>
    )
  }

  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={update}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${name}-err` : undefined}
        {...props}
      />
      {errors[name] && (
        <span id={`${name}-err`} className="field__error">
          {errors[name]}
        </span>
      )}
    </div>
  )

  return (
    <form className="card lead" onSubmit={submit} noValidate>
      <div className="card__body">
        <h2>Être rappelé par un conseiller</h2>
        <p className="muted">Un expert affine votre estimation et vous présente les aides possibles.</p>

        <div className="form-grid">
          {field('name', 'Nom complet', { autoComplete: 'name' })}
          {field('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
          {field('phone', 'Téléphone', { type: 'tel', autoComplete: 'tel' })}
          {field('postal_code', 'Code postal', { inputMode: 'numeric', maxLength: 5, autoComplete: 'postal-code' })}
        </div>

        {/* Champ piège anti-robots, invisible pour les humains */}
        <input
          className="hp"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.website}
          onChange={update}
        />

        <label className="consent">
          <input type="checkbox" name="consent" checked={form.consent} onChange={update} />
          J'accepte d'être recontacté au sujet de mon projet de rénovation.
        </label>
        {errors.consent && <span className="field__error">{errors.consent}</span>}

        {status === 'error' && (
          <p className="error" role="alert">
            Une erreur est survenue, merci de réessayer.
          </p>
        )}

        <button className="btn btn--full" disabled={status === 'sending'}>
          {status === 'sending' ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </div>
    </form>
  )
}
