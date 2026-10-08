import { useState } from 'react'
import { HOUSING, PERIODS, HEATING, WORKS, INSULATION_KEYS, TEMPERATURES, ZONES, estimate } from '../lib/estimate.js'
import { DEPARTMENTS, DEPARTMENT_LIST } from '../lib/departments.js'

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

function CheckGroup({ keys, values, onToggle, big = false }) {
  return (
    <div className={`choices ${big ? 'choices--grid' : ''}`}>
      {keys.map((key) => (
        <label
          key={key}
          className={`choice ${big ? 'choice--big' : ''} ${values.includes(key) ? 'is-active' : ''}`}
        >
          <input type="checkbox" checked={values.includes(key)} onChange={() => onToggle(key)} />
          <span className="choice__icon">{WORKS[key].icon}</span>
          {WORKS[key].label}
        </label>
      ))}
    </div>
  )
}

const toggle = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key])

export default function Simulator({ onDone }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    housing: 'maison',
    period: '1975-1999',
    surface: 90,
    department: '',
    heating: 'gaz',
    temperature: 20,
    alreadyDone: [],
    works: ['combles'],
  })
  const [error, setError] = useState('')

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const dept = DEPARTMENTS[form.department]
  const available = Object.keys(WORKS).filter((k) => !form.alreadyDone.includes(k))

  const next = () => {
    setError('')
    if (step === 0) {
      if (!(Number(form.surface) >= 10 && Number(form.surface) <= 1000)) {
        return setError('Indiquez une surface entre 10 et 1 000 m².')
      }
      if (!dept) return setError('Choisissez votre département.')
    }
    if (step < STEPS.length - 1) {
      // On retire des travaux à faire ceux déjà réalisés
      if (step === 1) setForm((f) => ({ ...f, works: f.works.filter((w) => !f.alreadyDone.includes(w)) }))
      return setStep(step + 1)
    }
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

            <label className="field-label" htmlFor="department">
              Département
            </label>
            <select
              id="department"
              className="select"
              value={form.department}
              onChange={(e) => set('department')(e.target.value)}
            >
              <option value="">Choisir…</option>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
            {dept && (
              <p className="field-hint">
                {dept.region} · zone climatique <strong>{dept.zone}</strong> ({ZONES[dept.zone].label.split(' — ')[1]})
              </p>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2>Comment chauffez-vous votre logement ?</h2>
            <p className="field-label">Énergie de chauffage actuelle</p>
            <ChoiceGroup name="heating" options={HEATING} value={form.heating} onChange={set('heating')} />

            <p className="field-label">Température habituelle dans les pièces à vivre</p>
            <div className="choices" role="radiogroup">
              {TEMPERATURES.map((t) => (
                <label key={t} className={`choice ${form.temperature === t ? 'is-active' : ''}`}>
                  <input
                    type="radio"
                    name="temperature"
                    checked={form.temperature === t}
                    onChange={() => set('temperature')(t)}
                  />
                  {t} °C
                </label>
              ))}
            </div>
            <p className="field-hint">19 °C est la température recommandée pour les pièces de vie.</p>

            <p className="field-label">Travaux déjà réalisés (facultatif)</p>
            <CheckGroup
              keys={INSULATION_KEYS}
              values={form.alreadyDone}
              onToggle={(k) => set('alreadyDone')(toggle(form.alreadyDone, k))}
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2>Quels travaux envisagez-vous ?</h2>
            <p className="field-label">Plusieurs choix possibles</p>
            <CheckGroup big keys={available} values={form.works} onToggle={(k) => set('works')(toggle(form.works, k))} />
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
