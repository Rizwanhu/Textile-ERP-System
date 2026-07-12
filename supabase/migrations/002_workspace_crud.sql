-- Workspace CRUD extensions: material line items + richer inventory

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type material_req_category as enum ('fabric', 'thread', 'trim', 'accessory', 'packaging');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type material_req_condition as enum ('new', 'leftover', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type material_req_source as enum ('local-buyer-fabric', 'local-buyer-thread', 'existing-stock');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type material_pipeline_status as enum ('pending', 'evaluating', 'in-use', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type stock_movement_type as enum ('in', 'out', 'adjust', 'return');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Materials pipeline status on header row
-- ---------------------------------------------------------------------------
alter table public.materials
  add column if not exists pipeline_status material_pipeline_status not null default 'pending';

-- ---------------------------------------------------------------------------
-- Per-order material requirements (line items)
-- ---------------------------------------------------------------------------
create table if not exists public.material_requirements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null references public.orders (id) on delete cascade,
  name text not null,
  category material_req_category not null,
  required numeric(12, 2) not null default 0,
  unit text not null default 'kg',
  condition material_req_condition not null default 'new',
  in_stock numeric(12, 2) not null default 0,
  utilized numeric(12, 2) not null default 0,
  wastage numeric(12, 2) not null default 0,
  unit_cost numeric(14, 2) not null default 0,
  source material_req_source not null,
  supplier text,
  inventory_id uuid references public.inventory (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_material_requirements_order
  on public.material_requirements (order_id);

create index if not exists idx_material_requirements_user
  on public.material_requirements (user_id);

-- ---------------------------------------------------------------------------
-- Inventory extras
-- ---------------------------------------------------------------------------
alter table public.inventory
  add column if not exists sku text;

alter table public.inventory
  add column if not exists category text;

alter table public.inventory
  add column if not exists unit_cost numeric(14, 2) not null default 0;

alter table public.inventory
  add column if not exists location text;

alter table public.inventory_history
  add column if not exists movement_type stock_movement_type not null default 'adjust';

alter table public.inventory_history
  add column if not exists reference text;

alter table public.inventory_history
  add column if not exists user_name text;

alter table public.inventory_history
  add column if not exists notes text;

-- ---------------------------------------------------------------------------
-- RLS for material_requirements
-- ---------------------------------------------------------------------------
alter table public.material_requirements enable row level security;

drop policy if exists "Users manage material requirements" on public.material_requirements;
create policy "Users manage material requirements" on public.material_requirements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists material_requirements_updated_at on public.material_requirements;
create trigger material_requirements_updated_at before update on public.material_requirements
  for each row execute function public.set_updated_at();
