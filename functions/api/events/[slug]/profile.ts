import {
  adminClient,
  getUserFromRequest,
  json,
  pickAssignedCharacters,
  type EventEnv,
} from '../../../lib/eventsShared';

type Body = {
  display_name?: string;
  x_handle?: string | null;
  game_id?: string | null;
};

export async function onRequestPost(context: { request: Request; env: EventEnv; params: { slug: string } }) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user) return json({ error: 'login required' }, 401);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  let body: Body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  const displayName = body.display_name?.trim();
  if (!displayName || displayName.length > 32) {
    return json({ error: '表示名は1〜32文字で入力してください' }, 400);
  }

  const slug = context.params.slug;
  const xHandle = body.x_handle?.trim().replace(/^@/, '') || null;
  const gameId = body.game_id?.trim() || null;

  const { data: existing } = await supabase
    .from('event_profiles')
    .select('id, assigned_char_a, assigned_char_b')
    .eq('event_slug', slug)
    .eq('user_id', user.id)
    .maybeSingle();

  const [charA, charB] = existing
    ? [existing.assigned_char_a, existing.assigned_char_b]
    : pickAssignedCharacters(user.id);

  const row = {
    event_slug: slug,
    user_id: user.id,
    display_name: displayName,
    x_handle: xHandle,
    game_id: gameId,
    assigned_char_a: charA,
    assigned_char_b: charB,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from('event_profiles').update(row).eq('id', existing.id)
  : await supabase.from('event_profiles').insert(row);

  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, assigned_char_a: charA, assigned_char_b: charB });
}