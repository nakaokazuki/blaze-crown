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
  title: 'βテスト非公式イベント',
  /** トップ告知など（イベントヒーローには出さない） */
  teaserBody: 'PayPay 1,500円 × 2名 — ミッション達成者を抽選',
  periodLabel: '2026年11月17日（火）〜12月1日（火）予定',
  prizeLabel: 'PayPay 1,500円 × 2名（達成者から抽選）',
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

export function missionKindLabel(kind: EventMissionKind): string {
  switch (kind) {
    case 'mission_1':
      return 'ミッション1: 累計5勝';
    case 'mission_2':
      return 'ミッション2: 指定キャラで2勝';
    case 'mission_3':
      return 'ミッション3: 指定キャラで2勝';
    case 'bonus_battle':
      return '追加対戦結果（当選比重アップ）';
    default:
      return kind;
  }
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
  submissions: { kind: EventMissionKind; status: EventSubmissionStatus }[],
): Record<'mission_1' | 'mission_2' | 'mission_3', EventSubmissionStatus | 'none'> {
  const missions = ['mission_1', 'mission_2', 'mission_3'] as const;
  const out: Record<'mission_1' | 'mission_2' | 'mission_3', EventSubmissionStatus | 'none'> = {
    mission_1: 'none',
    mission_2: 'none',
    mission_3: 'none',
  };
  for (const m of missions) {
    const related = submissions.filter((s) => s.kind === m);
    if (related.some((s) => s.status === 'approved')) {
      out[m] = 'approved';
    } else if (related.some((s) => s.status === 'pending')) {
      out[m] = 'pending';
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