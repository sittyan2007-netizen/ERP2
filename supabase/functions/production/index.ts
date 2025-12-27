import { getSupabaseClient, jsonResponse, logAudit, requirePasscode, unauthorizedResponse } from '../_shared/utils.ts';

const getAction = (req: Request) => {
  const { pathname } = new URL(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf('production');
  return index >= 0 ? parts[index + 1] : null;
};

Deno.serve(async (req) => {
  if (!requirePasscode(req)) {
    return unauthorizedResponse();
  }

  const action = getAction(req);
  if (action !== 'add-stage-event') {
    return jsonResponse({ error: 'Unsupported production action' }, { status: 404 });
  }

  const payload = await req.json();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.from('lot_stage_events').insert(payload.event).select().single();

  if (error) {
    return jsonResponse({ error: error.message }, { status: 400 });
  }

  await logAudit(supabase, 'lot_stage_events', data.id, 'create', { event: payload.event });

  return jsonResponse({ data });
});
