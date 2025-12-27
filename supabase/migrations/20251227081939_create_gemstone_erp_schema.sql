/*
  # Gemstone ERP Database Schema

  ## Overview
  Complete database schema for the Gemstone ERP system with immutable audit trails,
  production tracking, inventory management, invoicing, and cashbook functionality.

  ## New Tables

  ### Core Entities
  - `parties` - Business partners (suppliers, customers, workers)
    - `id` (uuid, primary key)
    - `name` (text, required)
    - `type` (text, optional)
    - `city` (text, optional)
    - `phone` (text, optional)
    - Timestamps: `created_at`, `updated_at`

  - `lots` - Gemstone lot definitions
    - `id` (uuid, primary key)
    - `lot_no` (text, required, unique)
    - `lot_name` (text, optional)
    - `description` (text, optional)
    - `format` (text, optional - CALIP, ROUND, FANCY)
    - `shape` (text, optional)
    - `size` (text, optional)
    - `grade` (text, optional)
    - `cts` (numeric, optional)
    - Timestamps: `created_at`, `updated_at`

  ### Inventory & Sales
  - `inventory_records` - Inventory tracking with sell status
    - `id` (uuid, primary key)
    - `lot_id` (uuid, references lots)
    - `party_id` (uuid, references parties)
    - `record_date` (date, required)
    - `sell_id` (text, optional)
    - `format`, `shape`, `size`, `description` (text fields)
    - `cts` (numeric, carat weight)
    - `amount` (numeric, monetary value)
    - `status` (text, default 'OPEN')
    - Timestamps: `created_at`, `updated_at`

  - `sell_records` - Sales transactions
    - `id` (uuid, primary key)
    - `sell_id` (text, required, unique)
    - `party_id` (uuid, references parties)
    - `record_date` (date, required)
    - `total_cts`, `total_amount`, `avg_price` (numeric)
    - Timestamps: `created_at`, `updated_at`

  ### Invoicing
  - `invoices` - Invoice headers
    - `id` (uuid, primary key)
    - `invoice_no` (text, required, unique)
    - `party_id` (uuid, references parties)
    - `sell_id` (text, optional)
    - `invoice_date` (date, required)
    - `transaction_type` (text, optional)
    - `total_cts`, `total_amount`, `avg_price` (numeric)
    - Timestamps: `created_at`, `updated_at`

  - `invoice_items` - Invoice line items
    - `id` (uuid, primary key)
    - `invoice_id` (uuid, references invoices, cascade delete)
    - `lot_id` (uuid, references lots)
    - `description`, `shape`, `size`, `grade` (text fields)
    - `pcs`, `cts`, `price`, `amount` (numeric)
    - Timestamps: `created_at`, `updated_at`

  ### Production & Memos
  - `memos` - Memo in/out tracking
    - `id` (uuid, primary key)
    - `memo_no` (text, required, unique)
    - `party_id` (uuid, references parties)
    - `memo_date` (date, required)
    - `status` (text, default 'OPEN')
    - Timestamps: `created_at`, `updated_at`

  - `memo_items` - Memo line items
    - `id` (uuid, primary key)
    - `memo_id` (uuid, references memos, cascade delete)
    - `lot_id` (uuid, references lots)
    - `description` (text)
    - `pcs`, `cts` (numeric)
    - `status` (text, default 'OPEN')
    - Timestamps: `created_at`, `updated_at`

  - `lot_stage_events` - Production stage tracking
    - `id` (uuid, primary key)
    - `lot_id` (uuid, references lots)
    - `stage` (text, required - ACID, HEAT, ROUGH, PREFORM, CUTTING, CALIBRATE)
    - `event_date` (date, required)
    - `yield_cts`, `reject_cts`, `wastage_cts` (numeric)
    - `notes` (text)
    - Timestamps: `created_at`, `updated_at`

  ### Financial
  - `ledger_entries` - Immutable cashbook entries
    - `id` (uuid, primary key)
    - `entry_date` (date, required)
    - `party_id` (uuid, references parties)
    - `lot_id` (uuid, references lots)
    - `entry_type` (text, required)
    - `amount` (numeric, required)
    - `balance` (numeric)
    - `status` (text, default 'OPEN')
    - Timestamps: `created_at`, `updated_at`

  ### Audit Trail
  - `audit_log` - Immutable audit trail for all write operations
    - `id` (uuid, primary key)
    - `at` (timestamptz, default now)
    - `entity_type` (text, required)
    - `entity_id` (uuid, optional)
    - `action` (text, required)
    - `summary_json` (jsonb)

  ## Indexes
  - Performance indexes on all date fields
  - Indexes on foreign key relationships (lot_id, party_id)
  - Unique indexes on business identifiers (lot_no, sell_id, invoice_no, memo_no)

  ## Triggers
  - Automatic `updated_at` timestamp updates on all tables

  ## Security (RLS)
  - RLS enabled on all tables
  - Public read access allowed for all tables (SELECT)
  - Write operations protected by Edge Functions with passcode verification
*/

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  type text,
  city text,
  phone text
);

create table if not exists public.lots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lot_no text not null,
  lot_name text,
  description text,
  format text,
  shape text,
  size text,
  grade text,
  cts numeric
);

create table if not exists public.inventory_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lot_id uuid references public.lots(id),
  party_id uuid references public.parties(id),
  record_date date not null,
  sell_id text,
  format text,
  shape text,
  size text,
  description text,
  cts numeric,
  amount numeric,
  status text default 'OPEN'
);

create table if not exists public.sell_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  sell_id text not null,
  party_id uuid references public.parties(id),
  record_date date not null,
  total_cts numeric,
  total_amount numeric,
  avg_price numeric
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  invoice_no text not null,
  party_id uuid references public.parties(id),
  sell_id text,
  invoice_date date not null,
  transaction_type text,
  total_cts numeric,
  total_amount numeric,
  avg_price numeric
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  invoice_id uuid references public.invoices(id) on delete cascade,
  lot_id uuid references public.lots(id),
  description text,
  shape text,
  size text,
  grade text,
  pcs numeric,
  cts numeric,
  price numeric,
  amount numeric
);

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  memo_no text not null,
  party_id uuid references public.parties(id),
  memo_date date not null,
  status text default 'OPEN'
);

create table if not exists public.memo_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  memo_id uuid references public.memos(id) on delete cascade,
  lot_id uuid references public.lots(id),
  description text,
  pcs numeric,
  cts numeric,
  status text default 'OPEN'
);

create table if not exists public.lot_stage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lot_id uuid references public.lots(id),
  stage text not null,
  event_date date not null,
  yield_cts numeric,
  reject_cts numeric,
  wastage_cts numeric,
  notes text
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  entry_date date not null,
  party_id uuid references public.parties(id),
  lot_id uuid references public.lots(id),
  entry_type text not null,
  amount numeric not null,
  balance numeric,
  status text default 'OPEN'
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz default now(),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary_json jsonb
);

create index if not exists idx_inventory_date on public.inventory_records(record_date);
create index if not exists idx_inventory_lot on public.inventory_records(lot_id);
create index if not exists idx_inventory_party on public.inventory_records(party_id);
create index if not exists idx_sell_date on public.sell_records(record_date);
create index if not exists idx_invoice_date on public.invoices(invoice_date);
create index if not exists idx_memo_date on public.memos(memo_date);
create index if not exists idx_lot_stage_date on public.lot_stage_events(event_date);
create index if not exists idx_ledger_date on public.ledger_entries(entry_date);

create unique index if not exists idx_lots_lot_no on public.lots(lot_no);
create unique index if not exists idx_sell_records_sell_id on public.sell_records(sell_id);
create unique index if not exists idx_invoices_invoice_no on public.invoices(invoice_no);
create unique index if not exists idx_memos_memo_no on public.memos(memo_no);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_parties') then
    create trigger set_updated_at_parties before update on public.parties for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_lots') then
    create trigger set_updated_at_lots before update on public.lots for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_inventory') then
    create trigger set_updated_at_inventory before update on public.inventory_records for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_sell') then
    create trigger set_updated_at_sell before update on public.sell_records for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_invoices') then
    create trigger set_updated_at_invoices before update on public.invoices for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_invoice_items') then
    create trigger set_updated_at_invoice_items before update on public.invoice_items for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_memos') then
    create trigger set_updated_at_memos before update on public.memos for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_memo_items') then
    create trigger set_updated_at_memo_items before update on public.memo_items for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_lot_stage') then
    create trigger set_updated_at_lot_stage before update on public.lot_stage_events for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_ledger') then
    create trigger set_updated_at_ledger before update on public.ledger_entries for each row execute procedure public.set_updated_at();
  end if;
end $$;

alter table public.parties enable row level security;
alter table public.lots enable row level security;
alter table public.inventory_records enable row level security;
alter table public.sell_records enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.memos enable row level security;
alter table public.memo_items enable row level security;
alter table public.lot_stage_events enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.audit_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'parties' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.parties for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lots' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.lots for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'inventory_records' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.inventory_records for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'sell_records' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.sell_records for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoices' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.invoices for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoice_items' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.invoice_items for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memos' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.memos for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memo_items' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.memo_items for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lot_stage_events' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.lot_stage_events for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ledger_entries' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.ledger_entries for select using (true);
  end if;
  
  if not exists (
    select 1 from pg_policies 
    where tablename = 'audit_log' and policyname = 'Public read'
  ) then
    create policy "Public read" on public.audit_log for select using (true);
  end if;
end $$;