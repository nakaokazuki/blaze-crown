import {
  adminClient,
  allMissionsApproved,
  getUserFromRequest,
  json,
  missionStateFromSubmissions,
  sha256Hex,
  verifyTurnstile,
  type EventEnv,
  type EventSubmissionKind,
} from '../../../../lib/eventsShared';

const VALID_KINDS = new Set<EventSubmissionKind>(['mission_1', 'mission_2', 'mission_3', 'bonus_battle']);
const MAX_BYTES = 5 * 1024 * 1024;

export async function onRequestGet(context: { request: Request; env: EventEnv; params: { slug: string } }) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user) return json({ error: 'login required' }, 401);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  const { data, error } = await supabase
    .from('event_submissions')
    .select('id, kind, status, rejection_reason, created_at, storage_path')
    .eq('event_slug', context.params.slug)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, 500);
  return json({ submissions: data ?? [] });
}

export async function onRequestPost(context: { request: Request; env: EventEnv; params: { slug: string } }) {
  const user = await getUserFromRequest(context.request, context.env);
  if (!user) return json({ error: 'login required' }, 401);

  const supabase = adminClient(context.env);
  if (!supabase) return json({ error: 'server not configured' }, 503);

  const slug = context.params.slug;

  const { data: profile } = await supabase
    .from('event_profiles')
    .select('id')
    .eq('event_slug', slug)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) return json({ error: '先にプロフィールを登録してください' }, 400);

  const form = await context.request.formData();
  const kind = form.get('kind')?.toString() as EventSubmissionKind | undefined;
  const file = form.get('image');
  const turnstile = form.get('turnstile_token')?.toString();

  if (!kind || !VALID_KINDS.has(kind)) return json({ error: 'invalid kind' }, 400);
  if (!(file instanceof File)) return json({ error: 'image required' }, 400);
  if (!file.type.startsWith('image/')) return json({ error: '画像ファイルのみ' }, 400);
  if (file.size > MAX_BYTES) return json({ error: '5MB以下の画像にしてください' }, 400);

  const secret = context.env.TURNSTILE_SECRET_KEY;
  const ip = context.request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  if (secret) {
    if (!turnstile || turnstile === 'dev-bypass') {
      return json({ error: 'turnstile required' }, 400);
    }
    const ok = await verifyTurnstile(turnstile, secret, ip);
    if (!ok) return json({ error: 'turnstile failed' }, 403);
  }

  const buf = await file.arrayBuffer();
  const contentHash = await sha256Hex(buf);

  const { data: dup } = await supabase
    .from('event_submissions')
    .select('id')
    .eq('event_slug', slug)
    .eq('user_id', user.id)
    .eq('content_hash', contentHash)
    .limit(1);

  if (dup?.length) {
    return json({ error: 'この画像は既に提出済みです' }, 409);
  }

  if (kind === 'bonus_battle') {
    const { data: subs } = await supabase
      .from('event_submissions')
      .select('kind, status')
      .eq('event_slug', slug)
      .eq('user_id', user.id);

    const state = missionStateFromSubmissions(
      (subs ?? []).map((s) => ({
        kind: s.kind as EventSubmissionKind,
        status: s.status as 'pending' | 'approved' | 'rejected',
      })),
    );
    if (!allMissionsApproved(state)) {
      return json({ error: '全ミッション承認後に提出できます' }, 400);
    }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const id = crypto.randomUUID();
  const storagePath = `${slug}/${user.id}/${id}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('event-submissions').upload(storagePath, buf, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return json({ error: uploadError.message }, 500);

  const { error: insertError } = await supabase.from('event_submissions').insert({
    event_slug: slug,
    user_id: user.id,
    kind,
    storage_path: storagePath,
    content_hash: contentHash,
    status: 'pending',
  });

  if (insertError) {
    await supabase.storage.from('event-submissions').remove([storagePath]);
    return json({ error: insertError.message }, 500);
  }

  return json({ ok: true, message: '提出しました。運営の承認をお待ちください。' });
}