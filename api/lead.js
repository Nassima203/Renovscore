// Fonction serveur Vercel : POST /api/lead
// Elle seule connaît la clé Supabase. Le navigateur n'en voit jamais aucune.
import { createClient } from '@supabase/supabase-js'
import { HOUSING, PERIODS, HEATING, WORKS, INSULATION_KEYS, estimate } from '../src/lib/estimate.js'
import { DEPARTMENTS } from '../src/lib/departments.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/

// Variables SANS préfixe VITE_ : Vite ne les met jamais dans le code du site.
const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function validate(body) {
  const b = body && typeof body === 'object' ? body : {}
  const name = String(b.name ?? '').trim()
  const email = String(b.email ?? '').trim()
  const phone = String(b.phone ?? '').trim()
  const postal_code = String(b.postal_code ?? '').trim()
  const surface = Number(b.surface)
  const works = Array.isArray(b.works) ? b.works.filter((w) => WORKS[w]) : []
  const temperature = Number(b.temperature)
  const alreadyDone = Array.isArray(b.alreadyDone) ? b.alreadyDone.filter((w) => INSULATION_KEYS.includes(w)) : []

  if (name.length < 2 || name.length > 120) return { error: 'Nom invalide.' }
  if (!EMAIL_RE.test(email) || email.length > 200) return { error: 'E-mail invalide.' }
  if (!PHONE_RE.test(phone)) return { error: 'Téléphone invalide.' }
  if (!/^\d{5}$/.test(postal_code)) return { error: 'Code postal invalide.' }
  if (!HOUSING[b.housing] || !PERIODS[b.period] || !HEATING[b.heating]) return { error: 'Simulation invalide.' }
  if (!(surface >= 10 && surface <= 1000)) return { error: 'Surface invalide.' }
  if (!DEPARTMENTS[b.department]) return { error: 'Département invalide.' }
  if (!(temperature >= 16 && temperature <= 25)) return { error: 'Température invalide.' }

  const input = { housing: b.housing, period: b.period, surface, heating: b.heating, works, department: b.department, temperature, alreadyDone }
  const result = estimate(input)
  if (result.works.length === 0) return { error: 'Aucun travaux sélectionné.' }
  return {
    lead: {
      name,
      email,
      phone: phone || null,
      postal_code,
      housing: input.housing,
      period: input.period,
      surface,
      heating: input.heating,
      works: result.works,
      department: input.department,
      temperature,
      already_done: alreadyDone,
      // Recalculé côté serveur : on ne fait pas confiance au chiffre envoyé par le navigateur
      estimated_saving: result.yearlySaving,
    },
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'Requête invalide.' })
    }
  }

  // Champ piège invisible : un humain le laisse vide, un robot le remplit
  if (body?.website) return res.status(200).json({ ok: true })

  const { error, lead } = validate(body)
  if (error) return res.status(400).json({ error })

  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Serveur non configuré.' })
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })
  const { data, error: dbError } = await supabase.from('leads').insert(lead).select('id').single()
  if (dbError) {
    console.error(dbError)
    return res.status(500).json({ error: "Impossible d'enregistrer la demande." })
  }
  // L'identifiant sert de lien vers la page de prise de rendez-vous
  return res.status(201).json({ ok: true, id: data.id })
}
