// POST /api/book : réserve un créneau d'appel
// Corps : { slot, leadId? , name?, phone?, email? }
// Avec leadId, les coordonnées sont reprises de la demande de rappel.
import { isBookable, slotToDate } from '../src/lib/slots.js'
import { getSupabase, readJson } from './_supabase.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }
  const b = readJson(req)
  if (!b) return res.status(400).json({ error: 'Requête invalide.' })

  const slot = String(b.slot || '')
  if (!isBookable(slot)) return res.status(400).json({ error: "Ce créneau n'est pas disponible." })

  const supabase = getSupabase()
  if (!supabase) return res.status(500).json({ error: 'Serveur non configuré.' })

  // Coordonnées : depuis la demande de rappel, ou saisies sur la page
  let contact
  let leadId = null
  if (b.leadId) {
    if (!UUID_RE.test(b.leadId)) return res.status(400).json({ error: 'Demande introuvable.' })
    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, name, phone, email')
      .eq('id', b.leadId)
      .maybeSingle()
    if (error || !lead) return res.status(404).json({ error: 'Demande introuvable.' })
    if (!lead.phone) return res.status(400).json({ error: 'Aucun numéro de téléphone dans la demande.', needPhone: true })
    leadId = lead.id
    contact = { name: lead.name, phone: lead.phone, email: lead.email }
  } else {
    const name = String(b.name || '').trim()
    const phone = String(b.phone || '').trim()
    const email = String(b.email || '').trim()
    if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Indiquez votre nom.' })
    if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'Numéro de téléphone invalide.' })
    if (email && !EMAIL_RE.test(email)) return res.status(400).json({ error: 'E-mail invalide.' })
    contact = { name, phone, email: email || null }
  }

  // Une demande = un seul rendez-vous : on remplace l'éventuel précédent
  if (leadId) await supabase.from('appointments').delete().eq('lead_id', leadId)

  const { error } = await supabase.from('appointments').insert({
    lead_id: leadId,
    slot_local: slot,
    starts_at: slotToDate(slot).toISOString(),
    ...contact,
  })
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Ce créneau vient d’être pris. Choisissez-en un autre.' })
    console.error(error)
    return res.status(500).json({ error: "Impossible d'enregistrer le rendez-vous." })
  }
  return res.status(201).json({ ok: true, slot, firstName: contact.name.split(' ')[0] })
}
