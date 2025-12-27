import { getSupabaseClient, jsonResponse, logAudit, requirePasscode, unauthorizedResponse } from '../_shared/utils.ts';

const getAction = (req: Request) => {
  const { pathname } = new URL(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf('sell');
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
    const sellId = payload.sell_id ?? `SELL-${Date.now()}`;
    let totalCts = 0;
    let totalAmount = 0;

    if (Array.isArray(payload.inventory_ids) && payload.inventory_ids.length) {
      const { data: inventory } = await supabase
        .from('inventory_records')
        .select('id, cts, amount')
        .in('id', payload.inventory_ids);

      totalCts = (inventory ?? []).reduce((sum, record) => sum + Number(record.cts ?? 0), 0);
      totalAmount = (inventory ?? []).reduce((sum, record) => sum + Number(record.amount ?? 0), 0);

      await supabase
        .from('inventory_records')
        .update({ status: 'SOLD', sell_id: sellId })
        .in('id', payload.inventory_ids);
    }

    const { data, error } = await supabase
      .from('sell_records')
      .insert({
        sell_id: sellId,
        party_id: payload.party_id ?? null,
        record_date: payload.record_date ?? new Date().toISOString().slice(0, 10),
        total_cts: totalCts,
        total_amount: totalAmount,
        avg_price: totalCts ? totalAmount / totalCts : 0
      })
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, 'sell_records', data.id, 'create', {
      sell_id: sellId,
      inventory_ids: payload.inventory_ids ?? []
    });

    return jsonResponse({ data });
  }

  if (action === 'update') {
    const { data, error } = await supabase
      .from('sell_records')
      .update(payload.changes)
      .eq('id', payload.id)
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, 'sell_records', data.id, 'update', { changes: payload.changes });

    return jsonResponse({ data });
  }

  if (action === 'delete') {
    const { error } = await supabase.from('sell_records').delete().eq('id', payload.id);

    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, 'sell_records', payload.id, 'delete', { id: payload.id });

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: 'Unsupported sell action' }, { status: 404 });
});
