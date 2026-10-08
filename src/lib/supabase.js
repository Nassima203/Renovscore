import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si les variables d'environnement ne sont pas définies, le site fonctionne
// quand même en « mode démo » (les demandes sont gardées dans le navigateur).
export const supabase = url && key ? createClient(url, key) : null
export const isDemoMode = !supabase

export async function saveLead(lead) {
  if (supabase) {
    const { error } = await supabase.from('leads').insert(lead)
    if (error) throw error
    return { demo: false }
  }
  try {
    const list = JSON.parse(localStorage.getItem('renovscore-leads') || '[]')
    list.push({ ...lead, created_at: new Date().toISOString() })
    localStorage.setItem('renovscore-leads', JSON.stringify(list))
  } catch {
    /* stockage indisponible : on ignore, c'est une démo */
  }
  await new Promise((r) => setTimeout(r, 500))
  return { demo: true }
}
