import {
  adminClient,
  allMissionsApproved,
  getUserFromRequest,
  json,
  lotteryWeight,
  missionStateFromSubmissions,
  type EventEnv,
} from '../../../lib/eventsShared';

export async function onRequestGet(context: { request: Request; env: EventEnv; params: { slug: string } }) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user) return json({ error: 'login required' }, 401);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  const slug = context.params.slug;

  const { data: profile, error: profileError } = await supabase
    .from('event_profiles')
    .select('*')
    .eq('event_slug', slug)
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) return json({ error: profileError.message }, 500);

  const { data: submissions, error: subError } = await supabase
    .from('event_submissions')
    .select('id, kind, status, rejection_reason, created_at, storage_path')
    .eq('event_slug', slug)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (subError) return json({ error: subError.message }, 500);

  const rows = (submissions ?? []).map((s) => ({
    kind: s.kind as 'mission_1' | 'mission_2' | 'mission_3' | 'bonus_battle',
    status: s.status as 'pending' | 'approved' | 'rejected',
  }));

  const missionState = missionStateFromSubmissions(rows);
  const cleared = allMissionsApproved(missionState);
  const approvedBonus = rows.filter((s) => s.kind === 'bonus_battle' && s.status === 'approved').length;

  return json({
    profile: profile
      ? {
          display_name: profile.display_name,
          x_handle: profile.x_handle,
          game_id: profile.game_id,
          assigned_char_a: profile.assigned_char_a,
          assigned_char_b: profile.assigned_char_b,
          created_at: profile.created_at,
        }
      : null,
    missionState,
    allMissionsCleared: cleared,
    lotteryWeight: lotteryWeight(approvedBonus, cleared),
    approvedBonusCount: approvedBonus,
    submissions: submissions ?? [],
    email: user.email,
  });
}