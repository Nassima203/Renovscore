# Rénov'Score — Simulateur de rénovation énergétique

> Projet de démonstration conçu, développé et déployé par **Nassima Adli** (Bachelor Développement Web, HETIC) dans le cadre d'une candidature en alternance.
> Site non officiel — les estimations sont purement indicatives.

🔗 **Démo en ligne :** _(à compléter après déploiement)_
🎨 **Maquette Figma :** _(à compléter)_

![Lighthouse](./docs/lighthouse.png) <!-- ajoute ta capture Lighthouse ici -->

## Le projet

Une landing page avec un **simulateur en 3 étapes** (logement → chauffage → travaux) qui estime :

- les économies annuelles sur la facture de chauffage,
- les tonnes de CO₂ évitées,
- l'évolution de l'étiquette énergie (A → G).

L'utilisateur peut ensuite laisser ses coordonnées pour être rappelé : la demande est enregistrée dans **Supabase**.

## Ce que ce projet montre

| Étape | Ce que j'ai fait |
| --- | --- |
| **Maquette → intégration** | Maquette Figma (composants, variables, desktop + mobile) intégrée en React, responsive mobile-first, accessible (navigation clavier, `aria-*`, `prefers-reduced-motion`). |
| **Développement** | Composants React, logique métier isolée et testée (`src/lib/estimate.js`), validation de formulaire côté client. |
| **Back-end** | Fonction serveur Vercel (`api/lead.js`) qui valide la demande et l'enregistre dans Supabase. Aucune clé n'est exposée dans le navigateur ; la table est verrouillée par **Row Level Security** (aucun accès public). |
| **Déploiement** | CI GitHub Actions (tests + build à chaque push), déploiement continu sur Vercel, headers de sécurité et de cache. |

## Stack

React 18 · Vite · Supabase (PostgreSQL) · Vercel · GitHub Actions · CSS natif · Anton + Poppins

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests unitaires du moteur d'estimation
npm run build    # build de production dans /dist
```

Avec `npm run dev`, la fonction serveur n'est pas lancée : le formulaire passe en **mode démo** (demandes stockées dans le navigateur).

## Brancher Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, colle et exécute le contenu de `supabase/schema.sql`.
3. Dans **Project Settings → API**, copie la Project URL et la clé `service_role` (secrète).

La clé `service_role` n'est utilisée que par la fonction serveur `api/lead.js`. Elle n'est jamais envoyée au navigateur ni poussée sur GitHub.

## Déployer sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New → Project** → importe le dépôt (Vite est détecté automatiquement).
2. Dans **Environment Variables**, ajoute `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (sans préfixe `VITE_`).
3. **Deploy**. Chaque push sur `main` redéploie automatiquement.

Pour tester la fonction serveur en local : `npx vercel dev` (avec un `.env.local` rempli à partir de `.env.example`).

## Hypothèses de calcul

Ordres de grandeur volontairement simples, documentés pour rester transparents :

- Consommation de chauffage par époque : avant 1975 ≈ 330 kWh/m²/an, 1975-1999 ≈ 220, 2000-2012 ≈ 150, après 2012 ≈ 90 (appartement : ×0,8).
- Gains par poste : combles −25 %, murs −20 %, fenêtres −10 %, VMC −7 %. Les gains se **cumulent de façon multiplicative** (deux gains de 20 % ≠ 40 %).
- Pompe à chaleur : COP moyen de 3.
- Prix et émissions moyens par énergie (fioul, gaz, électricité, bois).

Ce n'est ni un DPE ni un audit énergétique.
