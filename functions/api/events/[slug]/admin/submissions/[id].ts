import { adminClient, getUserFromRequest, isEventAdmin, json, type EventEnv } from '../../../../../lib/eventsShared';

type Body = {
  action?: 'approve' | 'reject';
  rejection_reason?: string;
};

export async function onRequestPatch(context: {
  request: Request;
  env: EventEnv;
  params: { slug: string; id: string };
}) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user || !isEventAdmin(user.email, context.env)) return json({ error: 'forbidden' }, 403);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  let body: Body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  if (body.action !== 'approve' && body.action !== 'reject') {
    return json({ error: 'invalid action' }, 400);
  }

  if (body.action === 'reject' && !body.rejection_reason?.trim()) {
    return json({ error: '差し戻し理由を入力してください' }, 400);
  }

  const { data: row, error: findErr } = await supabase
    .from('event_submissions')
    .select('id, status')
    .eq('id', context.params.id)
    .eq('event_slug', context.params.slug)
    .maybeSingle();

  if (findErr || !row) return json({ error: 'not found' }, 404);

  const patch = {
    status: body.action === 'approve' ? 'approved' : 'rejected',
    rejection_reason: body.action === 'reject' ? body.rejection_reason?.trim() : null,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('event_submissions').update(patch).eq('id', context.params.id);

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, status: patch.status });
}