import { useState } from 'react'
import { HOUSING, PERIODS, HEATING, WORKS, INSULATION_KEYS, TEMPERATURES, ZONES, estimate } from '../lib/estimate.js'
import { DEPARTMENTS, DEPARTMENT_LIST } from '../lib/departments.js'

const STEPS = ['Votre logement', 'Votre chauffage', 'Vos travaux']

// Valeurs proposées par défaut à l'ouverture du simulateur
const DEFAULT_FORM = {
  housing: 'maison',
  period: '1975-1999',
  surface: 90,
  department: '',
  heating: 'gaz',
  temperature: 20,
  alreadyDone: [],
  works: ['combles'],
}

// Ajout ou retrait d'un élément dans une liste
const toggle = (list, key) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key])

// Choix unique (boutons radio stylisés)
function ChoiceGroup({ name, options, value, onChange }) {
  return (
    <div className="choices" role="radiogroup">
      {Object.entries(options).map(([key, option]) => (
        <label key={key} className={`choice ${value === key ? 'is-active' : ''}`}>
          <input type="radio" name={name} checked={value === key} onChange={() => onChange(key)} />
          {option.label}
        </label>
      ))}
    </div>
  )
}

// Choix multiple parmi les travaux (cases à cocher stylisées)
function WorksGroup({ keys, values, onToggle, large = false }) {
  return (
    <div className={`choices ${large ? 'choices--grid' : ''}`}>
      {keys.map((key) => (
        <label key={key} className={`choice ${large ? 'choice--big' : ''} ${values.includes(key) ? 'is-active' : ''}`}>
          <input type="checkbox" checked={values.includes(key)} onChange={() => onToggle(key)} />
          <span className="choice__icon">{WORKS[key].icon}</span>
          {WORKS[key].label}
        </label>
      ))}
    </div>
  )
}

// Simulateur en 3 étapes : logement, chauffage, travaux
export default function Simulator({ onDone }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [error, setError] = useState('')

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))
  const dept = DEPARTMENTS[form.department]
  const isLastStep = step === STEPS.length - 1
  // Travaux proposés à l'étape 3 : tous, sauf ceux déjà réalisés
  const availableWorks = Object.keys(WORKS).filter((key) => !form.alreadyDone.includes(key))

  // Passage à l'étape suivante, ou calcul du résultat à la dernière étape
  const next = () => {
    setError('')
    if (step === 0) {
      const surface = Number(form.surface)
      if (!(surface >= 10 && surface <= 1000)) return setError('Indiquez une surface entre 10 et 1 000 m².')
      if (!dept) return setError('Choisissez votre département.')
    }
    if (step === 1) {
      // Retrait des travaux déjà réalisés de la sélection
      setForm((f) => ({ ...f, works: f.works.filter((key) => !f.alreadyDone.includes(key)) }))
    }
    if (!isLastStep) return setStep(step + 1)
    if (form.works.length === 0) return setError('Sélectionnez au moins un type de travaux.')
    onDone(form, estimate(form))
  }

  return (
    <div className="card">
      {/* Barre de progression */}
      <ol className="stepper" aria-label="Progression">
        {STEPS.map((label, i) => (
          <li key={label} className={i === step ? 'is-current' : i < step ? 'is-done' : ''}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className="card__body">
        {/* Étape 1 : logement */}
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
            <select id="department" value={form.department} onChange={(e) => set('department')(e.target.value)}>
              <option value="">Choisir…</option>
              {DEPARTMENT_LIST.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
            {dept && (
              <p className="field-hint">
                {dept.region} · zone climatique <strong>{dept.zone}</strong> ({ZONES[dept.zone].name})
              </p>
            )}
          </>
        )}

        {/* Étape 2 : chauffage */}
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
            <WorksGroup
              keys={INSULATION_KEYS}
              values={form.alreadyDone}
              onToggle={(key) => set('alreadyDone')(toggle(form.alreadyDone, key))}
            />
          </>
        )}

        {/* Étape 3 : travaux envisagés */}
        {step === 2 && (
          <>
            <h2>Quels travaux envisagez-vous ?</h2>
            <p className="field-label">Plusieurs choix possibles</p>
            <WorksGroup
              large
              keys={availableWorks}
              values={form.works}
              onToggle={(key) => set('works')(toggle(form.works, key))}
            />
          </>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        {/* Navigation entre les étapes */}
        <div className="card__actions">
          {step > 0 ? (
            <button className="btn btn--ghost" onClick={() => setStep(step - 1)}>
              ← Retour
            </button>
          ) : (
            <span />
          )}
          <button className="btn" onClick={next}>
            {isLastStep ? 'Voir mon estimation' : 'Continuer →'}
          </button>
        </div>
      </div>
    </div>
  )
}
