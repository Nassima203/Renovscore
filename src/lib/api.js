// Envoi de la demande de rappel à la fonction serveur (/api/lead)
export async function saveLead(lead) {
  let res = null
  try {
    res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    })
  } catch {
    // Réseau indisponible : bascule en mode démo ci-dessous
  }

  if (res?.ok) return { demo: false }

  // Mode démo : en local (npm run dev), la fonction serveur n'existe pas (erreur 404).
  // Conservation de la demande dans le navigateur uniquement.
  if (!res || res.status === 404) {
    try {
      const saved = JSON.parse(localStorage.getItem('renovscore-leads') || '[]')
      saved.push({ ...lead, created_at: new Date().toISOString() })
      localStorage.setItem('renovscore-leads', JSON.stringify(saved))
    } catch {
      // Stockage du navigateur indisponible : sans conséquence en démo
    }
    return { demo: true }
  }

  // Erreur renvoyée par le serveur
  const data = await res.json().catch(() => ({}))
  throw new Error(data.error || 'Erreur serveur')
}
