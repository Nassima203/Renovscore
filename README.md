# Rénov'Score

**Un simulateur en ligne qui estime combien des travaux de rénovation énergétique peuvent faire économiser sur le chauffage.**

🔗 **Site en ligne :** [renovscore.vercel.app](https://renovscore.vercel.app)
🎨 **Maquette Figma :** [Rénov'Score — Maquette](https://www.figma.com/design/abteACUSqio93S1jz5UfWQ)
👩‍💻 **Réalisé par :** Nassima Adli, Bachelor Développement Web à HETIC

> Projet de démonstration. Les chiffres sont des estimations indicatives, pas un diagnostic officiel.

---

## Sommaire

1. [Le projet en bref](#1-le-projet-en-bref)
2. [Ce que fait le site](#2-ce-que-fait-le-site)
3. [Comment ça marche](#3-comment-ça-marche)
4. [Technologies utilisées](#4-technologies-utilisées)
5. [Lancer le projet sur son ordinateur](#5-lancer-le-projet-sur-son-ordinateur)
6. [Organisation des fichiers](#6-organisation-des-fichiers)
7. [Sécurité](#7-sécurité)
8. [Le calcul](#8-le-calcul)
9. [Limites](#9-limites)

---

## 1. Le projet en bref

L'utilisateur répond à **3 questions** sur son logement, son chauffage et les travaux qu'il envisage.
Le site lui affiche ensuite :

- 💶 les **économies par an** sur sa facture de chauffage
- 🏷️ l'évolution de son **étiquette énergie** (de A à G)
- 🌍 les **tonnes de CO₂** évitées
- 📄 un **rapport détaillé** qui explique chaque étape du calcul

Il peut enfin laisser ses coordonnées pour **être rappelé par un conseiller**.

## 2. Ce que fait le site

| Étape | Ce que l'utilisateur renseigne |
| --- | --- |
| 1. Le logement | Maison ou appartement, année de construction, surface, département |
| 2. Le chauffage | Énergie (gaz, fioul, électricité, bois), température, travaux déjà faits |
| 3. Les travaux | Isolation des combles, des murs, fenêtres, ventilation, pompe à chaleur |

Résultat : une estimation chiffrée, un rapport détaillé et un formulaire de rappel.

## 3. Comment ça marche

```
  Navigateur (React)                 Serveur (Vercel)              Base de données
 ┌──────────────────┐   formulaire   ┌────────────────┐   insère   ┌───────────────┐
 │ Simulateur       │ ─────────────▶ │  api/lead.js   │ ─────────▶ │   Supabase    │
 │ + calcul         │                │ vérifie tout   │            │ (table leads) │
 │ + rapport        │                │ et recalcule   │            │               │
 └──────────────────┘                └────────────────┘            └───────────────┘
```

- **Le calcul** se fait directement dans le navigateur : le résultat s'affiche instantanément.
- **La demande de rappel** passe par une fonction serveur, qui vérifie les données avant de les enregistrer.

## 4. Technologies utilisées

| Rôle | Outil |
| --- | --- |
| Maquette | Figma |
| Interface | React 18 + Vite |
| Style | CSS natif, polices Anton et Poppins |
| Serveur | Fonction serveur Vercel |
| Base de données | Supabase (PostgreSQL) |
| Hébergement | Vercel (mise en ligne automatique à chaque push) |
| Tests | Tests unitaires avec `node:test`, lancés par GitHub Actions |

## 5. Lancer le projet sur son ordinateur

Il faut **Node.js 18 ou plus**.

```bash
# 1. Récupérer le projet
git clone https://github.com/Nassima203/Renovscore.git
cd Renovscore

# 2. Installer les dépendances
npm install

# 3. Lancer le site → http://localhost:5173
npm run dev
```

Autres commandes utiles :

| Commande | Ce qu'elle fait |
| --- | --- |
| `npm test` | Lance les tests du calcul |
| `npm run build` | Prépare la version de production |

> En local, le formulaire de rappel fonctionne en **mode démo** : rien n'est envoyé à la base de données.

## 6. Organisation des fichiers

```
Renovscore/
├── api/
│   └── lead.js              → fonction serveur : enregistre les demandes de rappel
├── public/
│   └── emails/              → maquettes des e-mails de confirmation
├── src/
│   ├── components/          → les blocs de la page (simulateur, résultats, rapport…)
│   ├── lib/
│   │   ├── estimate.js      → le calcul des économies
│   │   ├── estimate.test.js → les tests du calcul
│   │   ├── departments.js   → les 96 départements et leur zone climatique
│   │   ├── validation.js    → formats e-mail, téléphone, code postal
│   │   ├── format.js        → affichage des nombres à la française
│   │   └── api.js           → envoi de la demande au serveur
│   ├── App.jsx              → assemble la page
│   └── styles.css           → le design
├── supabase/
│   └── schema.sql           → création de la table en base
└── .env.example             → modèle des variables secrètes (sans vraies valeurs)
```

## 7. Sécurité

- 🔒 **Aucune clé secrète dans le code.** Elles sont stockées uniquement dans les réglages de Vercel.
- 🔒 **Le navigateur ne parle jamais directement à la base.** Tout passe par la fonction serveur.
- 🔒 **La base est verrouillée.** Personne ne peut lire les demandes depuis l'extérieur.
- ✅ **Les données sont vérifiées côté serveur** : e-mail, téléphone, code postal… et l'estimation est recalculée.
- 🤖 **Un champ invisible bloque les robots** qui remplissent les formulaires automatiquement.

## 8. Le calcul

Le calcul part de la consommation moyenne d'un logement de la même époque, puis l'ajuste à la situation de l'utilisateur.

| Critère | Effet sur la consommation |
| --- | --- |
| Année de construction | De 330 kWh/m²/an (avant 1975) à 55 kWh/m²/an (depuis 2022) |
| Appartement | −20 % par rapport à une maison |
| Climat du département | Nord et Est +10 % · Ouest et Centre −10 % · Méditerranée −42 % |
| Température de chauffe | Environ 7 % par degré au-dessus ou en dessous de 20 °C |

Gain de chaque type de travaux :

| Travaux | Gain |
| --- | --- |
| Isolation des combles | −25 % |
| Isolation des murs | −20 % |
| Fenêtres double vitrage | −10 % |
| Ventilation (VMC) | −7 % |
| Pompe à chaleur | Produit 2,7 à 3,3 fois plus de chaleur que l'électricité consommée |

> Les gains **ne s'additionnent pas** : chaque chantier s'applique à ce qui reste.
> Combles (−25 %) puis murs (−20 %) donnent **−40 %**, et non −45 %.

## 9. Limites

- Ce sont des **moyennes nationales** : la vraie facture dépend aussi du logement et des habitudes.
- Le **prix des travaux** et les **aides financières** ne sont pas pris en compte.
- L'étiquette énergie affichée est **indicative** : seul un diagnostiqueur certifié peut établir le DPE officiel.

---

*Projet réalisé par Nassima Adli dans le cadre d'une recherche d'alternance en développement web.*
