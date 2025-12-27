import { getSupabaseClient, jsonResponse, logAudit, requirePasscode, unauthorizedResponse } from '../_shared/utils.ts';

const getAction = (req: Request) => {
  const { pathname } = new URL(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf('invoice');
  return index >= 0 ? parts[index + 1] : null;
};

Deno.serve(async (req) => {
  if (!requirePasscode(req)) {
    return unauthorizedResponse();
  }

  const action = getAction(req);
  if (action !== 'create') {
    return jsonResponse({ error: 'Unsupported invoice action' }, { status: 404 });
  }

  const payload = await req.json();
  const supabase = getSupabaseClient();
  const invoiceNo = payload.invoice?.invoice_no ?? `INV-${Date.now()}`;

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      ...payload.invoice,
      invoice_no: invoiceNo
    })
    .select()
    .single();

  if (invoiceError) {
    return jsonResponse({ error: invoiceError.message }, { status: 400 });
  }

  const items = (payload.items ?? []).map((item: Record<string, unknown>) => ({
    ...item,
    invoice_id: invoice.id
  }));

  if (items.length) {
    const { error: itemError } = await supabase.from('invoice_items').insert(items);
    if (itemError) {
      return jsonResponse({ error: itemError.message }, { status: 400 });
    }
  }

  await logAudit(supabase, 'invoices', invoice.id, 'create', { invoice_no: invoiceNo, items_count: items.length });

  return jsonResponse({ data: invoice, items });
});
