-- À exécuter dans Supabase > SQL Editor
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  postal_code text not null check (postal_code ~ '^\d{5}$'),
  housing text not null,
  period text not null,
  surface integer not null check (surface between 10 and 1000),
  heating text not null,
  works text[] not null default '{}',
  department text not null,
  temperature smallint not null check (temperature between 16 and 25),
  already_done text[] not null default '{}',
  estimated_saving integer
);

-- Si la table existait déjà (première version du projet), ajoute les nouvelles colonnes :
alter table public.leads add column if not exists department text;
alter table public.leads add column if not exists temperature smallint;
alter table public.leads add column if not exists already_done text[] not null default '{}';

-- Sécurité : RLS activée SANS aucune policy.
-- => la clé publique (anon) ne peut ni lire ni écrire dans cette table.
-- Seule la fonction serveur /api/lead (clé service_role, stockée sur Vercel) peut insérer.
alter table public.leads enable row level security;

drop policy if exists "Public can insert leads" on public.leads;
