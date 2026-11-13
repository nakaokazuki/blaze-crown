import { createClient } from '@supabase/supabase-js';

type Env = {
  PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  TURNSTILE_SECRET_KEY?: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
};

type CommentRow = {
  id: string;
  article_id: string;
  guest_name: string | null;
  body: string;
  created_at: string;
};

async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  form.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

function adminClient(env: Env) {
  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const url = new URL(context.request.url);
  const articleId = url.searchParams.get('article_id');
  if (!articleId) {
    return Response.json({ error: 'article_id required' }, { status: 400 });
  }

  const supabase = adminClient(context.env);
  if (!supabase) {
    return Response.json({ comments: [] });
  }

  const { data, error } = await supabase
    .from('comments')
    .select('id, article_id, guest_name, body, created_at')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ comments: (data ?? []) as CommentRow[] });
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  let body: {
    article_id?: string;
    body?: string;
    guest_name?: string;
    turnstile_token?: string;
    access_token?: string;
  };

  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const articleId = body.article_id?.trim();
  const text = body.body?.trim();
  if (!articleId || !text || text.length > 2000) {
    return Response.json({ error: 'invalid payload' }, { status: 400 });
  }

  const secret = context.env.TURNSTILE_SECRET_KEY;
  const token = body.turnstile_token;
  const ip = context.request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';

  if (secret) {
    if (!token || token === 'dev-bypass') {
      return Response.json({ error: 'turnstile required' }, { status: 400 });
    }
    const ok = await verifyTurnstile(token, secret, ip);
    if (!ok) return Response.json({ error: 'turnstile failed' }, { status: 403 });
  }

  const supabase = adminClient(context.env);
  if (!supabase) {
    return Response.json({ error: 'server not configured' }, { status: 503 });
  }

  let userId: string | null = null;
  const accessToken = body.access_token;
  if (accessToken && context.env.PUBLIC_SUPABASE_ANON_KEY) {
    const userClient = createClient(context.env.PUBLIC_SUPABASE_URL, context.env.PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await userClient.auth.getUser(accessToken);
    if (!error && data.user) userId = data.user.id;
  }

  const status = userId ? 'approved' : 'pending';
  const guestName = userId ? null : (body.guest_name?.slice(0, 32) ?? 'ゲスト');

  const { error: insertError } = await supabase.from('comments').insert({
    article_id: articleId,
    user_id: userId,
    guest_name: guestName,
    body: text,
    status,
  });

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  const message =
    status === 'approved'
      ? 'コメントを投稿しました。'
      : 'コメントを受け付けました。承認後に表示されます。';

  return Response.json({ ok: true, message });
}
