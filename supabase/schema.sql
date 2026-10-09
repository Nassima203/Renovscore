-- Table des demandes de rappel
-- À exécuter une fois dans Supabase > SQL Editor

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Coordonnées
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  postal_code text not null check (postal_code ~ '^\d{5}$'),

  -- Paramètres de la simulation
  housing text not null,
  period text not null,
  surface integer not null check (surface between 10 and 1000),
  department text not null,
  heating text not null,
  temperature smallint not null check (temperature between 16 and 25),
  works text[] not null default '{}',
  already_done text[] not null default '{}',

  -- Économie annuelle estimée (€), recalculée par le serveur
  estimated_saving integer
);

-- Sécurité : RLS activée sans aucune règle d'accès.
-- Résultat : aucune lecture ni écriture possible depuis le navigateur ;
-- seule la fonction serveur api/lead.js (clé service_role) enregistre les demandes.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
