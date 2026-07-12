-- Human-readable client URLs (e.g. client_scotland) alongside UUID primary keys.
alter table public.clients
  add column if not exists slug text;

create unique index if not exists idx_clients_user_slug
  on public.clients (user_id, slug)
  where slug is not null;
