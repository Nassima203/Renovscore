// Le navigateur envoie la demande à notre propre fonction serveur (/api/lead).
// Aucune clé Supabase n'est présente dans le code du site.
export async function saveLead(lead) {
  let res
  try {
    res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    })
  } catch {
    res = null
  }

  if (res && res.ok) {
    const data = await res.json().catch(() => ({}))
    return { demo: false, id: data.id || null }
  }

  // En local avec `npm run dev`, la fonction serveur n'existe pas (404) :
  // on passe en mode démo et on garde la demande dans le navigateur.
  if (!res || res.status === 404) {
    try {
      const list = JSON.parse(localStorage.getItem('renovscore-leads') || '[]')
      list.push({ ...lead, created_at: new Date().toISOString() })
      localStorage.setItem('renovscore-leads', JSON.stringify(list))
    } catch {
      /* stockage indisponible : on ignore, c'est une démo */
    }
    return { demo: true }
  }

  const data = await res.json().catch(() => ({}))
  throw new Error(data.error || 'Erreur serveur')
}
