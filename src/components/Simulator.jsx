import { useState } from 'react'
import { HOUSING, PERIODS, HEATING, WORKS, estimate } from '../lib/estimate.js'

const STEPS = ['Votre logement', 'Votre chauffage', 'Vos travaux']

function ChoiceGroup({ name, options, value, onChange }) {
  return (
    <div className="choices" role="radiogroup">
      {Object.entries(options).map(([key, opt]) => (
        <label key={key} className={`choice ${value === key ? 'is-active' : ''}`}>
          <input type="radio" name={name} value={key} checked={value === key} onChange={() => onChange(key)} />
          {opt.icon && <span className="choice__icon">{opt.icon}</span>}
          {opt.label}
        </label>
      ))}
    </div>
  )
}

export default function Simulator({ onDone }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    housing: 'maison',
    period: '1975-1999',
    surface: 90,
    heating: 'gaz',
    works: ['combles'],
  })
  const [error, setError] = useState('')

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const toggleWork = (key) =>
    setForm((f) => ({
      ...f,
      works: f.works.includes(key) ? f.works.filter((w) => w !== key) : [...f.works, key],
    }))

  const next = () => {
    setError('')
    if (step === 0 && !(Number(form.surface) >= 10 && Number(form.surface) <= 1000)) {
      return setError('Indiquez une surface entre 10 et 1 000 m².')
    }
    if (step < STEPS.length - 1) return setStep(step + 1)
    if (form.works.length === 0) return setError('Sélectionnez au moins un type de travaux.')
    onDone(form, estimate(form))
  }

  return (
    <div className="card">
      <ol className="stepper" aria-label="Progression">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="card__body">
        {step === 0 && (
          <>
            <h2>Parlez-nous de votre logement</h2>
            <p className="field-label">Type de logement</p>
            <ChoiceGroup name="housing" options={HOUSING} value={form.housing} onChange={set('housing')} />

            <p className="field-label">Année de construction</p>
            <ChoiceGroup name="period" options={PERIODS} value={form.period} onChange={set('period')} />

            <label className="field-label" htmlFor="surface">
              Surface habitable : <strong>{form.surface} m²</strong>
            </label>
            <div className="surface">
              <input
                type="range"
                min="20"
                max="300"
                step="5"
                value={Math.min(300, form.surface)}
                onChange={(e) => set('surface')(Number(e.target.value))}
                aria-label="Surface en m²"
              />
              <input
                id="surface"
                type="number"
                min="10"
                max="1000"
                value={form.surface}
                onChange={(e) => set('surface')(e.target.value)}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Comment chauffez-vous votre logement ?</h2>
            <p className="field-label">Énergie de chauffage actuelle</p>
            <ChoiceGroup name="heating" options={HEATING} value={form.heating} onChange={set('heating')} />
          </>
        )}

        {step === 2 && (
          <>
            <h2>Quels travaux envisagez-vous ?</h2>
            <p className="field-label">Plusieurs choix possibles</p>
            <div className="choices choices--grid">
              {Object.entries(WORKS).map(([key, w]) => (
                <label key={key} className={`choice choice--big ${form.works.includes(key) ? 'is-active' : ''}`}>
                  <input type="checkbox" checked={form.works.includes(key)} onChange={() => toggleWork(key)} />
                  <span className="choice__icon">{w.icon}</span>
                  {w.label}
                </label>
              ))}
            </div>
          </>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="card__actions">
          {step > 0 ? (
            <button className="btn btn--ghost" onClick={() => setStep(step - 1)}>
              ← Retour
            </button>
          ) : (
            <span />
          )}
          <button className="btn" onClick={next}>
            {step === STEPS.length - 1 ? 'Voir mon estimation' : 'Continuer →'}
          </button>
        </div>
      </div>
    </div>
  )
}
