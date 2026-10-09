import { useState } from 'react'
import { saveLead } from '../lib/api.js'
import { EMAIL_RE, PHONE_RE, POSTAL_CODE_RE } from '../lib/validation.js'

const EMPTY_FORM = { name: '', email: '', phone: '', postal_code: '', website: '', consent: false }

// Formulaire « Être rappelé par un conseiller », envoyé avec les données de la simulation
export default function LeadForm({ input }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [demo, setDemo] = useState(false)

  // Mise à jour d'un champ (texte ou case à cocher)
  const update = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  // Vérification des champs avant envoi
  const validate = () => {
    const err = {}
    if (form.name.trim().length < 2) err.name = 'Indiquez votre nom.'
    if (!EMAIL_RE.test(form.email.trim())) err.email = 'Adresse e-mail invalide.'
    if (form.phone && !PHONE_RE.test(form.phone.trim())) err.phone = 'Numéro de téléphone invalide.'
    if (!POSTAL_CODE_RE.test(form.postal_code)) err.postal_code = 'Code postal à 5 chiffres.'
    if (!form.consent) err.consent = 'Votre accord est nécessaire pour être recontacté.'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  // Envoi : coordonnées + paramètres de la simulation (le serveur refait le calcul)
  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setStatus('sending')
    try {
      const res = await saveLead({
        ...input,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        postal_code: form.postal_code,
        website: form.website,
      })
      setDemo(res.demo)
      setStatus('sent')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  // Message de confirmation après envoi
  if (status === 'sent') {
    return (
      <div className="card success">
        <div className="card__body">
          <h2>Merci {form.name.trim().split(' ')[0]} !</h2>
          <p>Votre demande a bien été enregistrée. Un conseiller vous recontacterait sous 48 h.</p>
          {demo && (
            <p className="muted small">
              (Mode démo : la demande est stockée dans votre navigateur. En ligne, elle est enregistrée dans Supabase
              via une fonction serveur.)
            </p>
          )}
        </div>
      </div>
    )
  }

  // Champ texte avec libellé et message d'erreur accessibles
  const field = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={update}
        aria-invalid={Boolean(errors[name])}
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
    <form className="card" onSubmit={submit} noValidate>
      <div className="card__body">
        <h2>Être rappelé par un conseiller</h2>
        <p className="muted">Un expert affine votre estimation et vous présente les aides possibles.</p>

        <div className="form-grid">
          {field('name', 'Nom complet', { autoComplete: 'name' })}
          {field('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
          {field('phone', 'Téléphone (facultatif)', { type: 'tel', autoComplete: 'tel' })}
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
