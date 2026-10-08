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
  estimated_saving integer
);

-- Sécurité : le site public peut uniquement INSÉRER, jamais lire les leads.
alter table public.leads enable row level security;

drop policy if exists "Public can insert leads" on public.leads;
create policy "Public can insert leads"
  on public.leads for insert
  to anon
  with check (true);
