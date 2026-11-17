import { adminClient, eventLeaderboardScore, json, type EventEnv, type EventSubmissionKind } from '../../../lib/eventsShared';

const TOP_N = 10;

export async function onRequestGet(context: { request: Request; env: EventEnv; params: { slug: string } }) {
  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  const slug = context.params.slug;

  const { data: profiles, error: pErr } = await supabase
    .from('event_profiles')
    .select('user_id, display_name')
    .eq('event_slug', slug);

  if (pErr) return json({ error: pErr.message }, 500);

  const userIds = (profiles ?? []).map((p) => p.user_id);
  if (userIds.length === 0) {
    return json({ entries: Array.from({ length: TOP_N }, () => null) });
  }

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

  const ranked = (profiles ?? [])
    .map((p) => ({
      display_name: p.display_name,
      score: eventLeaderboardScore(byUser.get(p.user_id) ?? []),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.display_name.localeCompare(b.display_name, 'ja'))
    .slice(0, TOP_N);

  const entries: (string | null)[] = ranked.map((r) => r.display_name);
  while (entries.length < TOP_N) entries.push(null);

  return json({ entries });
}