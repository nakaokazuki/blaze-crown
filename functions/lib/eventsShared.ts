import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type EventEnv = {
  PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PUBLIC_SUPABASE_ANON_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  EVENT_ADMIN_EMAILS?: string;
};

export type EventSubmissionKind = 'mission_1' | 'mission_2' | 'mission_3' | 'bonus_battle';
export type EventSubmissionStatus = 'pending' | 'approved' | 'rejected';

const LAUNCH_CHARS = [
  'ルミナ',
  'ダン',
  'フレイ',
  'ツバキ',
  'カゲトラ',
  'ムラサメ',
  'ノエル',
  'レオニス',
  'ザフィール',
  'アルファルド',
];

export function adminClient(env: EventEnv): SupabaseClient | null {
  if (!env.PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function getUserFromRequest(
  request: Request,
  env: EventEnv,
): Promise<{ id: string; email?: string } | null> {
  const header = request.headers.get('Authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !env.PUBLIC_SUPABASE_ANON_KEY) return null;
  const userClient = createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email };
}

export function isEventAdmin(email: string | undefined, env: EventEnv): boolean {
  if (!email || !env.EVENT_ADMIN_EMAILS?.trim()) return false;
  const allowed = env.EVENT_ADMIN_EMAILS.split(',').map((s) => s.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

export async function requireEventAdmin(
  request: Request,
  env: EventEnv,
): Promise<{ user: { id: string; email?: string } } | { error: Response }> {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return { error: json({ error: 'ログインが必要です' }, 401) };
  }
  if (!env.EVENT_ADMIN_EMAILS?.trim()) {
    return {
      error: json(
        {
          error:
            'EVENT_ADMIN_EMAILS が未設定です。.dev.vars（ローカル）または Cloudflare の環境変数に、Google ログインのメールをカンマ区切りで設定し、開発サーバーを再起動してください。',
        },
        403,
      ),
    };
  }
  if (!isEventAdmin(user.email, env)) {
    return {
      error: json(
        {
          error: `運営権限がありません（${user.email ?? 'メールなし'}）。EVENT_ADMIN_EMAILS にこのメールを追加してください。`,
        },
        403,
      ),
    };
  }
  return { user };
}

export function pickAssignedCharacters(userId: string): [string, string] {
  const pool = [...LAUNCH_CHARS];
  let seed = 0;
  for (let i = 0; i < userId.length; i++) seed = (seed * 31 + userId.charCodeAt(i)) >>> 0;
  const shuffle = (arr: string[], s: number) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const ordered = shuffle(pool, seed);
  return [ordered[0], ordered[1]];
}

export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const MISSION_WIN_TARGETS = {
  mission_1: 5,
  mission_2: 2,
  mission_3: 2,
} as const;

type MissionId = keyof typeof MISSION_WIN_TARGETS;
type SubmissionRow = { kind: EventSubmissionKind; status: EventSubmissionStatus };

function approvedWinCount(submissions: SubmissionRow[], mission: MissionId): number {
  const target = MISSION_WIN_TARGETS[mission];
  const n = submissions.filter((s) => s.kind === mission && s.status === 'approved').length;
  return Math.min(n, target);
}

export function missionStateFromSubmissions(
  submissions: SubmissionRow[],
): Record<MissionId, EventSubmissionStatus | 'none' | 'in_progress'> {
  const missions = ['mission_1', 'mission_2', 'mission_3'] as const;
  const out: Record<MissionId, EventSubmissionStatus | 'none' | 'in_progress'> = {
    mission_1: 'none',
    mission_2: 'none',
    mission_3: 'none',
  };
  for (const m of missions) {
    const related = submissions.filter((s) => s.kind === m);
    const wins = approvedWinCount(submissions, m);
    const target = MISSION_WIN_TARGETS[m];
    const hasPending = related.some((s) => s.status === 'pending');

    if (wins >= target) out[m] = 'approved';
    else if (hasPending) out[m] = 'pending';
    else if (wins > 0) out[m] = 'in_progress';
    else if (related.some((s) => s.status === 'rejected')) out[m] = 'rejected';
  }
  return out;
}

export function allMissionsApproved(state: ReturnType<typeof missionStateFromSubmissions>): boolean {
  return (
    state.mission_1 === 'approved' &&
    state.mission_2 === 'approved' &&
    state.mission_3 === 'approved'
  );
}

/** ランキング用（ミッション承認勝利数を優先、全達成後は追加提出承認数） */
export function eventLeaderboardScore(submissions: SubmissionRow[]): number {
  const missions = ['mission_1', 'mission_2', 'mission_3'] as const;
  const missionWins = missions.reduce((sum, m) => sum + approvedWinCount(submissions, m), 0);
  const cleared = allMissionsApproved(missionStateFromSubmissions(submissions));
  const bonusApproved = cleared
    ? submissions.filter((s) => s.kind === 'bonus_battle' && s.status === 'approved').length
    : 0;
  return missionWins * 1_000_000 + bonusApproved;
}

export function lotteryWeight(approvedBonus: number, cleared: boolean): number {
  if (!cleared) return 0;
  return Math.round((1 + 0.01 * approvedBonus) * 100) / 100;
}

export async function verifyTurnstile(token: string, secret: string, ip: string): Promise<boolean> {
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