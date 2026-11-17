import { adminClient, getUserFromRequest, isEventAdmin, json, type EventEnv } from '../../../../../lib/eventsShared';

export async function onRequestGet(context: {
  request: Request;
  env: EventEnv;
  params: { slug: string; id: string };
}) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user) return json({ error: 'login required' }, 401);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  const { data: row, error } = await supabase
    .from('event_submissions')
    .select('user_id, storage_path')
    .eq('id', context.params.id)
    .eq('event_slug', context.params.slug)
    .maybeSingle();

  if (error || !row) return json({ error: 'not found' }, 404);

  const admin = isEventAdmin(user.email, context.env);
  if (row.user_id !== user.id && !admin) return json({ error: 'forbidden' }, 403);

  const { data: signed, error: signError } = await supabase.storage
    .from('event-submissions')
    .createSignedUrl(row.storage_path, 3600);

  if (signError || !signed?.signedUrl) return json({ error: signError?.message ?? 'sign failed' }, 500);

  return json({ url: signed.signedUrl });
}