/** 非公式イベント設定（今回開催） */
export const DEFAULT_EVENT_SLUG = 'cbt-paypay-2026-11';

export const DEFAULT_GAME_FOR_EVENTS = 'blaze-crown';

/** β開始時点の初期キャラ 10 体（characters.yaml と一致） */
export const EVENT_LAUNCH_CHARACTER_NAMES = [
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
] as const;

export type EventMissionKind = 'mission_1' | 'mission_2' | 'mission_3' | 'bonus_battle';

export type EventSubmissionStatus = 'pending' | 'approved' | 'rejected';

export const EVENT_CONFIG = {
  slug: DEFAULT_EVENT_SLUG,
  /** ヒーロー上の小さな見出し */
  seriesLabel: '第１回非公式イベント',
  title: 'βテスト開始記念',
  /** トップ告知など（イベントヒーローには出さない） */
  teaserBody: 'PayPay 1,500円 × 2名 — ミッション達成者を抽選',
  periodLabel: '2026年11月17日（火）〜12月1日（火）予定',
  prizeLabel: 'PayPay 1,500円 × 2名',
  /** 景品直下の注釈（期間と同じサイズ） */
  prizeFootnote: '※達成者から抽選',
  /** ランディング用 meta description（検索スニペット・約120字目安） */
  metaDescription:
    '第１回非公式イベント「βテスト開始記念」。PayPay 1,500円×2名をミッション達成者から抽選。11/17〜12/1予定。ブレイズクラウン非公式ファンサイト主催（公式とは無関係）。',
} as const;

export function eventPath(game: string, slug: string): string {
  return `/games/${game}/events/${slug}/`;
}

export function eventPlayPath(game: string, slug: string): string {
  return `/games/${game}/events/${slug}/play/`;
}

export function eventAdminPath(game: string, slug: string): string {
  return `/games/${game}/events/${slug}/admin/`;
}

export type EventMissionLabelProfile = {
  assigned_char_a?: string | null;
  assigned_char_b?: string | null;
};

export function missionKindLabel(
  kind: EventMissionKind,
  profile?: EventMissionLabelProfile | null
): string {
  switch (kind) {
    case 'mission_1':
      return 'ミッション1: 累計5勝';
    case 'mission_2':
      return `ミッション2: ${missionCharWinPhrase(profile?.assigned_char_a)}`;
    case 'mission_3':
      return `ミッション3: ${missionCharWinPhrase(profile?.assigned_char_b)}`;
    case 'bonus_battle':
      return '追加対戦結果（当選比重アップ）';
    default:
      return kind;
  }
}

/** 提出フォームの種別プルダウン用（「ミッションN:」なしの内容のみ） */
export function missionKindSubmitLabel(
  kind: EventMissionKind,
  profile?: EventMissionLabelProfile | null,
): string {
  switch (kind) {
    case 'mission_1':
      return '累計5勝';
    case 'mission_2':
      return missionCharWinPhrase(profile?.assigned_char_a);
    case 'mission_3':
      return missionCharWinPhrase(profile?.assigned_char_b);
    case 'bonus_battle':
      return '追加対戦結果（当選比重アップ）';
    default:
      return kind;
  }
}

/** 提出履歴など用の短いミッション名 */
export function missionKindShortLabel(kind: EventMissionKind): string {
  switch (kind) {
    case 'mission_1':
      return 'ミッション１';
    case 'mission_2':
      return 'ミッション２';
    case 'mission_3':
      return 'ミッション３';
    case 'bonus_battle':
      return '追加対戦';
    default:
      return kind;
  }
}

export function formatSubmissionShort(iso: string): string {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}/${day} ${h}:${min}`;
}

/** ミッションごとの勝利数目標（証拠画像1枚＝1勝、運営承認でカウント） */
export const MISSION_WIN_TARGETS = {
  mission_1: 5,
  mission_2: 2,
  mission_3: 2,
} as const;

export type EventMissionId = keyof typeof MISSION_WIN_TARGETS;

export type MissionUiStatus = EventSubmissionStatus | 'none' | 'in_progress';

type MissionSubmissionRow = { kind: EventMissionKind; status: EventSubmissionStatus };

/** 承認済み提出の枚数（審査中・差し戻しは含めない） */
export function approvedWinCount(submissions: MissionSubmissionRow[], mission: EventMissionId): number {
  const target = MISSION_WIN_TARGETS[mission];
  const n = submissions.filter((s) => s.kind === mission && s.status === 'approved').length;
  return Math.min(n, target);
}

export function missionWinProgressFromSubmissions(
  submissions: MissionSubmissionRow[],
  mission: EventMissionId,
): { current: number; target: number } {
  return {
    current: approvedWinCount(submissions, mission),
    target: MISSION_WIN_TARGETS[mission],
  };
}

export function missionCharWinPhrase(charName: string | null | undefined): string {
  const name = charName?.trim();
  if (!name) return '指定キャラを編成に含め2勝';
  return `${name}を編成に含め2勝`;
}

export function pickAssignedCharacters(userId: string): [string, string] {
  const pool = [...EVENT_LAUNCH_CHARACTER_NAMES];
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

export function lotteryWeight(approvedBonusCount: number, allMissionsCleared: boolean): number {
  if (!allMissionsCleared) return 0;
  return 1 + 0.01 * approvedBonusCount;
}

export function deriveMissionState(
  submissions: MissionSubmissionRow[],
): Record<EventMissionId, MissionUiStatus> {
  const missions = ['mission_1', 'mission_2', 'mission_3'] as const;
  const out: Record<EventMissionId, MissionUiStatus> = {
    mission_1: 'none',
    mission_2: 'none',
    mission_3: 'none',
  };
  for (const m of missions) {
    const related = submissions.filter((s) => s.kind === m);
    const wins = approvedWinCount(submissions, m);
    const target = MISSION_WIN_TARGETS[m];
    const hasPending = related.some((s) => s.status === 'pending');

    if (wins >= target) {
      out[m] = 'approved';
    } else if (hasPending) {
      out[m] = 'pending';
    } else if (wins > 0) {
      out[m] = 'in_progress';
    } else if (related.some((s) => s.status === 'rejected')) {
      out[m] = 'rejected';
    }
  }
  return out;
}

export function allMissionsApproved(missionState: ReturnType<typeof deriveMissionState>): boolean {
  return missionState.mission_1 === 'approved' &&
    missionState.mission_2 === 'approved' &&
    missionState.mission_3 === 'approved';
}