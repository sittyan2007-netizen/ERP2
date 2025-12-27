/*
  # Enable Write Operations on All Tables

  ## Overview
  Add INSERT, UPDATE, and DELETE policies to all tables to enable full CRUD operations.
  Write operations are protected at the application level via Edge Functions with passcode verification.

  ## Changes
  - Add INSERT policies to allow creation of new records
  - Add UPDATE policies to allow modification of existing records
  - Add DELETE policies to allow deletion of records
  - Policies enabled for all tables: parties, lots, inventory_records, sell_records, invoices, invoice_items, memos, memo_items, lot_stage_events, ledger_entries
*/

do $$
begin
  -- Parties table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'parties' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.parties for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'parties' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.parties for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'parties' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.parties for delete using (true);
  end if;

  -- Lots table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lots' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.lots for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lots' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.lots for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lots' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.lots for delete using (true);
  end if;

  -- Inventory records table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'inventory_records' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.inventory_records for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'inventory_records' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.inventory_records for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'inventory_records' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.inventory_records for delete using (true);
  end if;

  -- Sell records table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'sell_records' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.sell_records for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'sell_records' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.sell_records for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'sell_records' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.sell_records for delete using (true);
  end if;

  -- Invoices table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoices' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.invoices for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoices' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.invoices for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoices' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.invoices for delete using (true);
  end if;

  -- Invoice items table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoice_items' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.invoice_items for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoice_items' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.invoice_items for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'invoice_items' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.invoice_items for delete using (true);
  end if;

  -- Memos table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memos' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.memos for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memos' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.memos for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memos' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.memos for delete using (true);
  end if;

  -- Memo items table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memo_items' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.memo_items for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memo_items' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.memo_items for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'memo_items' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.memo_items for delete using (true);
  end if;

  -- Lot stage events table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lot_stage_events' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.lot_stage_events for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lot_stage_events' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.lot_stage_events for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'lot_stage_events' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.lot_stage_events for delete using (true);
  end if;

  -- Ledger entries table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ledger_entries' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.ledger_entries for insert with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ledger_entries' and policyname = 'Public update'
  ) then
    create policy "Public update" on public.ledger_entries for update with check (true);
  end if;
  if not exists (
    select 1 from pg_policies 
    where tablename = 'ledger_entries' and policyname = 'Public delete'
  ) then
    create policy "Public delete" on public.ledger_entries for delete using (true);
  end if;

  -- Audit log table
  if not exists (
    select 1 from pg_policies 
    where tablename = 'audit_log' and policyname = 'Public insert'
  ) then
    create policy "Public insert" on public.audit_log for insert with check (true);
  end if;

end $$;