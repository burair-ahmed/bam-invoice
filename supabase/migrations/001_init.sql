-- Run this in the Supabase SQL editor.
-- The app saves with the service role from the server (PIN session).
-- Anon key cannot read or write invoices.

create table if not exists public.invoices (
  id uuid primary key,
  owner_key text not null default 'default',
  transporter_name text not null default '',
  period_from date,
  period_to date,
  search_text text not null default '',
  is_draft boolean not null default false,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_owner_updated_idx
  on public.invoices (owner_key, updated_at desc);

create table if not exists public.suggestions (
  id text primary key,
  owner_key text not null default 'default',
  kind text not null,
  value text not null,
  last_used timestamptz not null default now()
);

create table if not exists public.company_settings (
  owner_key text primary key default 'default',
  logo_url text,
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
alter table public.suggestions enable row level security;
alter table public.company_settings enable row level security;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos_public_read"
  on storage.objects for select
  using (bucket_id = 'logos');
