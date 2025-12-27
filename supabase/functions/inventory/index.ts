import { getSupabaseClient, jsonResponse, logAudit, requirePasscode, unauthorizedResponse } from '../_shared/utils.ts';

const getAction = (req: Request) => {
  const { pathname } = new URL(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf('inventory');
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
    const { data, error } = await supabase.from('inventory_records').insert(payload.record).select().single();
    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }
    await logAudit(supabase, 'inventory_records', data.id, 'create', { record: payload.record });
    return jsonResponse({ data });
  }

  if (action === 'update') {
    const { data, error } = await supabase
      .from('inventory_records')
      .update(payload.changes)
      .eq('id', payload.id)
      .select()
      .single();
    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }
    await logAudit(supabase, 'inventory_records', data.id, 'update', { changes: payload.changes });
    return jsonResponse({ data });
  }

  if (action === 'delete') {
    const { error } = await supabase.from('inventory_records').delete().eq('id', payload.id);
    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }
    await logAudit(supabase, 'inventory_records', payload.id, 'delete', { id: payload.id });
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Unsupported inventory action' }, { status: 404 });
});
