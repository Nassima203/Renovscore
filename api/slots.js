// GET /api/slots : prochains jours ouvrés et créneaux encore libres
import { upcomingDays } from '../src/lib/slots.js'
import { getSupabase } from './_supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }
  const days = upcomingDays()
  const supabase = getSupabase()
  let taken = new Set()
  if (supabase) {
    const { data, error } = await supabase
      .from('appointments')
      .select('slot_local')
      .eq('status', 'confirmed')
      .gte('starts_at', new Date().toISOString())
    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Impossible de charger les créneaux.' })
    }
    taken = new Set(data.map((r) => r.slot_local))
  }
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({
    days: days.map((d) => ({ date: d.date, slots: d.slots.map((s) => ({ slot: s, free: !taken.has(s) })) })),
  })
}
