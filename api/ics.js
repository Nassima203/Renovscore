// GET /api/ics?creneau=2026-10-13T10:30 : fichier calendrier (Apple Calendar, Outlook, etc.)
import { icsContent, slotToDate } from '../src/lib/slots.js'

export default function handler(req, res) {
  const slot = String(req.query?.creneau || '')
  if (!slotToDate(slot)) return res.status(400).send('Créneau invalide.')
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="rdv-renovscore.ics"')
  return res.status(200).send(icsContent(slot))
}
