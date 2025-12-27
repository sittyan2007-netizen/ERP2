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

create trigger set_updated_at_parties before update on public.parties for each row execute procedure public.set_updated_at();
create trigger set_updated_at_lots before update on public.lots for each row execute procedure public.set_updated_at();
create trigger set_updated_at_inventory before update on public.inventory_records for each row execute procedure public.set_updated_at();
create trigger set_updated_at_sell before update on public.sell_records for each row execute procedure public.set_updated_at();
create trigger set_updated_at_invoices before update on public.invoices for each row execute procedure public.set_updated_at();
create trigger set_updated_at_invoice_items before update on public.invoice_items for each row execute procedure public.set_updated_at();
create trigger set_updated_at_memos before update on public.memos for each row execute procedure public.set_updated_at();
create trigger set_updated_at_memo_items before update on public.memo_items for each row execute procedure public.set_updated_at();
create trigger set_updated_at_lot_stage before update on public.lot_stage_events for each row execute procedure public.set_updated_at();
create trigger set_updated_at_ledger before update on public.ledger_entries for each row execute procedure public.set_updated_at();

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

create policy "Public read" on public.parties for select using (true);
create policy "Public read" on public.lots for select using (true);
create policy "Public read" on public.inventory_records for select using (true);
create policy "Public read" on public.sell_records for select using (true);
create policy "Public read" on public.invoices for select using (true);
create policy "Public read" on public.invoice_items for select using (true);
create policy "Public read" on public.memos for select using (true);
create policy "Public read" on public.memo_items for select using (true);
create policy "Public read" on public.lot_stage_events for select using (true);
create policy "Public read" on public.ledger_entries for select using (true);
create policy "Public read" on public.audit_log for select using (true);
