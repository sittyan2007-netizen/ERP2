import { getSupabaseClient, jsonResponse, logAudit, requirePasscode, unauthorizedResponse } from '../_shared/utils.ts';

const getAction = (req: Request) => {
  const { pathname } = new URL(req.url);
  const parts = pathname.split('/').filter(Boolean);
  const index = parts.indexOf('memo');
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
    const memoNo = payload.memo?.memo_no ?? `MEMO-${Date.now()}`;
    const { data, error } = await supabase
      .from('memos')
      .insert({
        ...payload.memo,
        memo_no: memoNo,
        status: 'OPEN'
      })
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, 'memos', data.id, 'create', { memo_no: memoNo });

    return jsonResponse({ data });
  }

  if (action === 'close') {
    const { data: memo, error: memoError } = await supabase
      .from('memos')
      .select('status')
      .eq('id', payload.memo_id)
      .single();

    if (memoError) {
      return jsonResponse({ error: memoError.message }, { status: 400 });
    }

    if (memo.status === 'LOCKED') {
      return jsonResponse({ error: 'Memo is already locked' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('memos')
      .update({ status: 'LOCKED' })
      .eq('id', payload.memo_id)
      .select()
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, { status: 400 });
    }

    await logAudit(supabase, 'memos', data.id, 'close', { memo_id: payload.memo_id });

    return jsonResponse({ data });
  }

  return jsonResponse({ error: 'Unsupported memo action' }, { status: 404 });
});
