import {
  adminClient,
  allMissionsApproved,
  getUserFromRequest,
  isEventAdmin,
  json,
  lotteryWeight,
  missionStateFromSubmissions,
  type EventEnv,
  type EventSubmissionKind,
} from '../../../../../lib/eventsShared';

export async function onRequestGet(context: { request: Request; env: EventEnv; params: { slug: string } }) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user || !isEventAdmin(user.email, context.env)) return json({ error: 'forbidden' }, 403);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  const slug = context.params.slug;

  const { data: profiles, error: pErr } = await supabase
    .from('event_profiles')
    .select('*')
    .eq('event_slug', slug)
    .order('created_at', { ascending: false });

  if (pErr) return json({ error: pErr.message }, 500);

  const userIds = (profiles ?? []).map((p) => p.user_id);
  if (userIds.length === 0) return json({ participants: [] });

  const { data: submissions, error: sErr } = await supabase
    .from('event_submissions')
    .select('user_id, kind, status')
    .eq('event_slug', slug)
    .in('user_id', userIds);

  if (sErr) return json({ error: sErr.message }, 500);

  const byUser = new Map<string, { kind: EventSubmissionKind; status: 'pending' | 'approved' | 'rejected' }[]>();
  for (const s of submissions ?? []) {
    const list = byUser.get(s.user_id) ?? [];
    list.push({ kind: s.kind as EventSubmissionKind, status: s.status as 'pending' | 'approved' | 'rejected' });
    byUser.set(s.user_id, list);
  }

  const emailByUser = new Map<string, string>();
  for (const uid of userIds) {
    const { data: authUser } = await supabase.auth.admin.getUserById(uid);
    if (authUser?.user?.email) emailByUser.set(uid, authUser.user.email);
  }

  const participants = (profiles ?? []).map((p) => {
    const subs = byUser.get(p.user_id) ?? [];
    const missionState = missionStateFromSubmissions(subs);
    const cleared = allMissionsApproved(missionState);
    const approvedBonus = subs.filter((s) => s.kind === 'bonus_battle' && s.status === 'approved').length;
    const pendingCount = subs.filter((s) => s.status === 'pending').length;
    return {
      user_id: p.user_id,
      email: emailByUser.get(p.user_id) ?? null,
      display_name: p.display_name,
      x_handle: p.x_handle,
      game_id: p.game_id,
      assigned_char_a: p.assigned_char_a,
      assigned_char_b: p.assigned_char_b,
      created_at: p.created_at,
      missionState,
      allMissionsCleared: cleared,
      approvedBonusCount: approvedBonus,
      lotteryWeight: lotteryWeight(approvedBonus, cleared),
      pendingSubmissions: pendingCount,
    };
  });

  return json({ participants });
}