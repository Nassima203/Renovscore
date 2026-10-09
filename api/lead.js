/**
 * Fonction serveur Vercel : POST /api/lead
 * Vérification de la demande de rappel, recalcul de l'estimation et enregistrement dans Supabase.
 * Seul endroit qui connaît la clé Supabase : aucune clé n'est envoyée au navigateur.
 */
import { createClient } from '@supabase/supabase-js'
import { estimate, INSULATION_KEYS } from '../src/lib/estimate.js'
import { EMAIL_RE, PHONE_RE, POSTAL_CODE_RE } from '../src/lib/validation.js'

// Clés lues dans les variables d'environnement Vercel (sans préfixe VITE_, donc jamais intégrées au site)
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Lecture du corps de la requête (objet JSON ou texte)
function parseBody(body) {
  if (typeof body !== 'string') return body && typeof body === 'object' ? body : null
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

// Vérification des données, puis construction de la ligne à enregistrer
function buildLead(body) {
  const text = (value) => String(value ?? '').trim()
  const name = text(body.name)
  const email = text(body.email)
  const phone = text(body.phone)
  const postalCode = text(body.postal_code)
  const surface = Number(body.surface)
  const temperature = Number(body.temperature)
  const works = Array.isArray(body.works) ? body.works : []
  const alreadyDone = Array.isArray(body.alreadyDone)
    ? body.alreadyDone.filter((key) => INSULATION_KEYS.includes(key))
    : []

  // Coordonnées
  if (name.length < 2 || name.length > 120) return { error: 'Nom invalide.' }
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: 'E-mail invalide.' }
  if (phone && !PHONE_RE.test(phone)) return { error: 'Téléphone invalide.' }
  if (!POSTAL_CODE_RE.test(postalCode)) return { error: 'Code postal invalide.' }

  // Simulation : recalcul complet, sans se fier aux chiffres envoyés par le navigateur
  if (!(surface >= 10 && surface <= 1000)) return { error: 'Surface invalide.' }
  if (!body.department) return { error: 'Département invalide.' }
  let result
  try {
    result = estimate({
      housing: body.housing,
      period: body.period,
      surface,
      heating: body.heating,
      department: body.department,
      temperature,
      works,
      alreadyDone,
    })
  } catch {
    return { error: 'Simulation invalide.' }
  }
  if (result.works.length === 0) return { error: 'Aucun travaux sélectionné.' }

  return {
    lead: {
      name,
      email,
      phone: phone || null,
      postal_code: postalCode,
      housing: body.housing,
      period: body.period,
      surface,
      department: body.department,
      heating: body.heating,
      temperature,
      works: result.works,
      already_done: alreadyDone,
      estimated_saving: result.yearlySaving,
    },
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  const body = parseBody(req.body)
  if (!body) return res.status(400).json({ error: 'Requête invalide.' })

  // Champ piège : vide pour un humain, rempli par un robot → réponse « ok » sans enregistrement
  if (body.website) return res.status(200).json({ ok: true })

  const { error, lead } = buildLead(body)
  if (error) return res.status(400).json({ error })

  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: 'Serveur non configuré.' })

  // Enregistrement dans la table « leads »
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
  const { error: dbError } = await supabase.from('leads').insert(lead)
  if (dbError) {
    console.error(dbError)
    return res.status(500).json({ error: "Impossible d'enregistrer la demande." })
  }
  return res.status(201).json({ ok: true })
}
