-- TextileERP — initial Supabase schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('Owner', 'Manager', 'Operator', 'Viewer');
create type order_status as enum (
  'draft', 'active', 'in-production', 'qc-hold',
  'completed', 'dispatched', 'overdue', 'cancelled'
);
create type material_condition as enum ('processing', 'bought', 'from_stock');
create type evaluation_status as enum ('approved', 'needs_sourcing');
create type billing_currency as enum ('GBP', 'PKR', 'USD');
create type client_type as enum ('export', 'local');
create type fulfillment_status as enum (
  'in-process', 'waiting-design', 'partial-delivered', 'delivered', 'cancelled'
);
create type line_item_type as enum ('product', 'service', 'adjustment');
create type invoice_status as enum ('draft', 'issued', 'void');
create type payment_method as enum ('bank_transfer', 'cash', 'other');
create type ledger_entry_type as enum (
  'opening_balance', 'invoice', 'payment', 'credit_note', 'debit_note', 'line_item'
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role user_role not null default 'Owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  factory_name text not null default 'TextileERP Factory',
  address text,
  phone text,
  email text,
  bank_details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients & billing
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type client_type not null default 'local',
  billing_currency billing_currency not null default 'PKR',
  contact_name text,
  contact_email text,
  contact_phone text,
  billing_address text,
  opening_balance numeric(14, 2) not null default 0,
  opening_balance_date date,
  opening_balance_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_line_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  order_id text,
  serial_number int not null,
  description text not null,
  quantity numeric(12, 2) not null default 0,
  unit_price numeric(14, 4) not null default 0,
  currency billing_currency not null,
  exchange_rate numeric(14, 4) not null default 1,
  invoice_value numeric(14, 2) not null default 0,
  input_amount numeric(14, 2),
  type line_item_type not null default 'product',
  fulfillment_status fulfillment_status not null default 'in-process',
  invoiced boolean not null default false,
  invoice_id uuid,
  credit_note_id uuid,
  order_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  invoice_number text not null,
  line_item_ids uuid[] not null default '{}',
  subtotal numeric(14, 2) not null default 0,
  opening_balance_included numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  currency billing_currency not null,
  status invoice_status not null default 'draft',
  issued_at timestamptz,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null,
  amount numeric(14, 2) not null,
  billing_currency billing_currency not null,
  input_currency billing_currency not null,
  input_amount numeric(14, 2) not null,
  exchange_rate numeric(14, 4) not null default 1,
  description text not null,
  method payment_method,
  reference text,
  created_at timestamptz not null default now()
);

create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  credit_note_number text not null,
  line_item_id uuid references public.client_line_items (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,
  amount numeric(14, 2) not null,
  currency billing_currency not null,
  exchange_rate numeric(14, 4) not null default 1,
  reason text not null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, credit_note_number)
);

-- ---------------------------------------------------------------------------
-- Orders & production
-- ---------------------------------------------------------------------------
create table public.orders (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  client_name text not null,
  product text not null,
  po_number text,
  qty int not null default 0,
  value numeric(14, 2) not null default 0,
  order_date date not null,
  delivery_date date not null,
  status order_status not null default 'draft',
  contact_name text,
  contact_email text,
  contact_phone text,
  ship_to text,
  fabric text,
  notes text,
  produced int not null default 0,
  rejected int not null default 0,
  packed int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_size_breakdown (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  size text not null,
  color text not null,
  qty int not null default 0,
  rate numeric(14, 2) not null default 0
);

create table public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  step_key text not null,
  label text not null,
  planned_date date,
  actual_date date,
  note text,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Materials pipeline (per order)
-- ---------------------------------------------------------------------------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null references public.orders (id) on delete cascade unique,
  material_type text,
  condition material_condition,
  qty numeric(12, 2),
  unit text,
  kg_price numeric(14, 2),
  label_details text,
  tags text,
  accessories text,
  required_material numeric(12, 2),
  available_in_stock numeric(12, 2),
  material_gap numeric(12, 2),
  evaluation_notes text,
  evaluation_status evaluation_status,
  material_used numeric(12, 2),
  wastage numeric(12, 2),
  utilization_date date,
  remaining_material numeric(12, 2),
  returned_to_stock numeric(12, 2),
  disposed numeric(12, 2),
  pipeline_step int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Inventory
-- ---------------------------------------------------------------------------
create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  material_name text not null,
  material_type text not null,
  current_stock numeric(12, 2) not null default 0,
  unit text not null default 'kg',
  reorder_level numeric(12, 2) not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.inventory_history (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid not null references public.inventory (id) on delete cascade,
  order_id text references public.orders (id) on delete set null,
  change_amount numeric(12, 2) not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Expense sheets (per order)
-- ---------------------------------------------------------------------------
create table public.local_buyer_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null references public.orders (id) on delete cascade,
  supplier_name text not null,
  item_name text not null,
  qty numeric(12, 2) not null,
  unit text not null,
  rate_per_unit numeric(14, 2) not null,
  total_amount numeric(14, 2) not null,
  purchase_date date,
  invoice_number text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.cutting_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null references public.orders (id) on delete cascade unique,
  total_material_received numeric(12, 2),
  cut_breakdown jsonb not null default '[]',
  total_cut numeric(12, 2),
  wastage numeric(12, 2),
  material_left numeric(12, 2),
  cutter_name text,
  date date,
  wages numeric(14, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stitching_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null references public.orders (id) on delete cascade unique,
  pieces_received int,
  pieces_stitched int,
  pieces_rejected int,
  rate_per_piece numeric(14, 2),
  total_wages numeric(14, 2),
  worker_name text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finishing_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null references public.orders (id) on delete cascade unique,
  pieces_received int,
  ironing_done boolean default false,
  ironing_count int,
  tagging_done boolean default false,
  tagging_count int,
  packing_done boolean default false,
  packing_count int,
  qc_pass int,
  qc_fail int,
  defect_types text[] default '{}',
  wages numeric(14, 2),
  qc_inspector text,
  date_finished date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  rent numeric(14, 2) default 0,
  fuel numeric(14, 2) default 0,
  electricity numeric(14, 2) default 0,
  gas numeric(14, 2) default 0,
  depreciation numeric(14, 2) default 0,
  other jsonb default '[]',
  total numeric(14, 2) default 0,
  order_allocations jsonb default '[]',
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create table public.admin_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text references public.orders (id) on delete cascade,
  month text not null,
  salaries numeric(14, 2) default 0,
  communication numeric(14, 2) default 0,
  stationery numeric(14, 2) default 0,
  bank_charges numeric(14, 2) default 0,
  transport numeric(14, 2) default 0,
  misc jsonb default '[]',
  total numeric(14, 2) default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- FK additions after invoices/credit_notes exist
-- ---------------------------------------------------------------------------
alter table public.client_line_items
  add constraint client_line_items_invoice_fk
  foreign key (invoice_id) references public.invoices (id) on delete set null;

alter table public.client_line_items
  add constraint client_line_items_credit_note_fk
  foreign key (credit_note_id) references public.credit_notes (id) on delete set null;

alter table public.client_line_items
  add constraint client_line_items_order_fk
  foreign key (order_id) references public.orders (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index idx_clients_user on public.clients (user_id);
create index idx_orders_user on public.orders (user_id);
create index idx_orders_status on public.orders (status);
create index idx_client_line_items_client on public.client_line_items (client_id);
create index idx_inventory_user on public.inventory (user_id);

-- ---------------------------------------------------------------------------
-- Updated-at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger workspace_settings_updated_at before update on public.workspace_settings
  for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger client_line_items_updated_at before update on public.client_line_items
  for each row execute function public.set_updated_at();
create trigger invoices_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger materials_updated_at before update on public.materials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile + workspace on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, name, email, role)
  values (new.id, display_name, new.email, 'Owner');

  insert into public.workspace_settings (user_id, factory_name)
  values (new.id, 'TextileERP Factory');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.clients enable row level security;
alter table public.client_line_items enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.credit_notes enable row level security;
alter table public.orders enable row level security;
alter table public.order_size_breakdown enable row level security;
alter table public.order_timeline enable row level security;
alter table public.materials enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_history enable row level security;
alter table public.local_buyer_items enable row level security;
alter table public.cutting_sheets enable row level security;
alter table public.stitching_sheets enable row level security;
alter table public.finishing_sheets enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.admin_expenses enable row level security;

-- Profiles
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Workspace settings
create policy "Users manage own workspace" on public.workspace_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Generic user-owned tables
create policy "Users manage own clients" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own client line items" on public.client_line_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own payments" on public.payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own credit notes" on public.credit_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage order breakdown" on public.order_size_breakdown
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Users manage order timeline" on public.order_timeline
  for all using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Users manage own materials" on public.materials
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own inventory" on public.inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage inventory history" on public.inventory_history
  for all using (
    exists (
      select 1 from public.inventory i
      where i.id = inventory_id and i.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.inventory i
      where i.id = inventory_id and i.user_id = auth.uid()
    )
  );

create policy "Users manage local buyer items" on public.local_buyer_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage cutting sheets" on public.cutting_sheets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage stitching sheets" on public.stitching_sheets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage finishing sheets" on public.finishing_sheets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage fixed expenses" on public.fixed_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage admin expenses" on public.admin_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Order number sequence helper
-- ---------------------------------------------------------------------------
create or replace function public.next_order_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yr text := to_char(now(), 'YYYY');
  seq int;
begin
  select count(*) + 1 into seq
  from public.orders
  where user_id = p_user_id
    and id like 'ORD-' || yr || '-%';

  return 'ORD-' || yr || '-' || lpad(seq::text, 3, '0');
end;
$$;
