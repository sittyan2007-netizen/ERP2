import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export const requirePasscode = (req: Request) => {
  const passcode = req.headers.get('X-COMPANY-PASSCODE');
  const expected = Deno.env.get('COMPANY_PASSCODE');
  if (!expected || passcode !== expected) {
    return false;
  }
  return true;
};

export const jsonResponse = (body: unknown, init: ResponseInit = {}) => {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });
};

export const unauthorizedResponse = () => {
  return jsonResponse({ error: 'Invalid passcode' }, { status: 401 });
};

export const logAudit = async (
  supabase: ReturnType<typeof getSupabaseClient>,
  entityType: string,
  entityId: string | null,
  action: string,
  summary: Record<string, unknown>
) => {
  await supabase.from('audit_log').insert({
    entity_type: entityType,
    entity_id: entityId,
    action,
    summary_json: summary
  });
};
