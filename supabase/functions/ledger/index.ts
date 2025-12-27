import { getSupabaseClient, jsonResponse, logAudit, requirePasscode, unauthorizedResponse } from '../_shared/utils.ts';

const getAction = (req: Request) => {
  const { pathname } = new URL(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf('ledger');
  return index >= 0 ? parts[index + 1] : null;
};

Deno.serve(async (req) => {
  if (!requirePasscode(req)) {
    return unauthorizedResponse();
  }

  const action = getAction(req);
  const payload = await req.json();
  const supabase = getSupabaseClient();

  if (action === 'create') {
    const { data, error } = await supabase
      .from('ledger_entries')
      .insert({
        ...payload.entry,
        status: 'OPEN'
      })
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, 'ledger_entries', data.id, 'create', { entry: payload.entry });

    return jsonResponse({ data });
  }

  if (action === 'post') {
    const { data: entry, error: entryError } = await supabase
      .from('ledger_entries')
      .select('status')
      .eq('id', payload.entry_id)
      .single();

    if (entryError) {
      return jsonResponse({ error: entryError.message }, { status: 400 });
    }

    if (entry.status === 'POSTED') {
      return jsonResponse({ error: 'Entry already posted' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('ledger_entries')
      .update({ status: 'POSTED' })
      .eq('id', payload.entry_id)
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, 'ledger_entries', data.id, 'post', { entry_id: payload.entry_id });

    return jsonResponse({ data });
  }

  return jsonResponse({ error: 'Unsupported ledger action' }, { status: 404 });
});
