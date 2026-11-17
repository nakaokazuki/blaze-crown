import { adminClient, getUserFromRequest, isEventAdmin, json, type EventEnv } from '../../../../lib/eventsShared';

export async function onRequestGet(context: { request: Request; env: EventEnv; params: { slug: string } }) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user || !isEventAdmin(user.email, context.env)) return json({ error: 'forbidden' }, 403);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  const url = new URL(context.request.url);
  const status = url.searchParams.get('status') ?? 'pending';
  const slug = context.params.slug;

  let builder = supabase
    .from('event_submissions')
    .select('id, user_id, kind, status, rejection_reason, created_at, storage_path')
    .eq('event_slug', slug);

  if (status !== 'all') builder = builder.eq('status', status);

  const { data: rows, error } = await builder.order('created_at', { ascending: false }).limit(100);
  if (error) return json({ error: error.message }, 500);

  const enriched = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data: prof } = await supabase
        .from('event_profiles')
        .select('display_name, x_handle, game_id')
        .eq('event_slug', slug)
        .eq('user_id', row.user_id)
        .maybeSingle();
      return { ...row, profile: prof };
    }),
  );

  return json({ submissions: enriched });
}