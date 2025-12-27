import { getSupabaseClient, jsonResponse, logAudit, requirePasscode, unauthorizedResponse } from '../_shared/utils.ts';

const getAction = (req: Request) => {
  const { pathname } = new URL(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf('import');
  return index >= 0 ? parts[index + 1] : null;
};

const allowedTables = [
  'parties',
  'lots',
  'inventory_records',
  'sell_records',
  'invoices',
  'invoice_items',
  'memos',
  'memo_items',
  'lot_stage_events',
  'ledger_entries'
];

Deno.serve(async (req) => {
  if (!requirePasscode(req)) {
    return unauthorizedResponse();
  }

  const action = getAction(req);
  if (action !== 'bulk') {
    return jsonResponse({ error: 'Unsupported import action' }, { status: 404 });
  }

  const payload = await req.json();
  const supabase = getSupabaseClient();
  const results: Record<string, number> = {};

  for (const table of allowedTables) {
    const rows = payload.tables?.[table] ?? [];
    if (!rows.length) continue;

    const { error } = await supabase.from(table).upsert(rows);
    if (error) {
      return jsonResponse({ error: error.message, table }, { status: 400 });
    }
    results[table] = rows.length;
  }

  await logAudit(supabase, 'import', null, 'bulk', { results });

  return jsonResponse({ success: true, results, unmappedSheets: payload.unmappedSheets ?? [] });
});
