import { useCallback, useEffect, useState } from 'react';
import { apiFetch, eventApiBase } from '../../lib/eventApi';
import {
  missionKindLabel,
  missionWinProgressFromSubmissions,
  deriveMissionState,
  type EventMissionKind,
  type EventSubmissionStatus,
} from '../../lib/events';
import { statusClass, statusLabel } from './statusLabels';
import EventLeaderboard from './EventLeaderboard';
import { useEventSession } from './useEventSession';

type MeResponse = {
  profile: {
    display_name: string;
    x_handle: string | null;
    game_id: string | null;
    assigned_char_a: string;
    assigned_char_b: string;
  } | null;
  missionState: ReturnType<typeof deriveMissionState>;
  allMissionsCleared: boolean;
  lotteryWeight: number;
  approvedBonusCount: number;
  submissions: {
    id: string;
    kind: string;
    status: string;
    rejection_reason: string | null;
    created_at: string;
  }[];
  email?: string;
};

type Props = {
  slug: string;
  landingHref: string;
};

export default function EventPlayApp({ slug, landingHref }: Props) {
  const { session, accessToken, loading: authLoading, signInWithGoogle, signOut, supabase } = useEventSession();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [xHandle, setXHandle] = useState('');
  const [gameId, setGameId] = useState('');
  const [submitKind, setSubmitKind] = useState<EventMissionKind>('mission_1');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [rankingLockOpen, setRankingLockOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const api = eventApiBase(slug);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MeResponse>(`${api}/me`, { accessToken });
      setMe(data);
      if (data.profile) {
        setDisplayName(data.profile.display_name);
        setXHandle(data.profile.x_handle ?? '');
        setGameId(data.profile.game_id ?? '');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [accessToken, api]);

  useEffect(() => {
    if (accessToken) void refresh();
  }, [accessToken, refresh]);

  useEffect(() => {
    if (me?.allMissionsCleared) setRankingLockOpen(false);
  }, [me?.allMissionsCleared]);

  useEffect(() => {
    if (!rankingLockOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRankingLockOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rankingLockOpen]);

  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileOpen]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setProfileMessage(null);
    try {
      await apiFetch(`${api}/profile`, {
        method: 'POST',
        accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          x_handle: xHandle.trim() || null,
          game_id: gameId.trim() || null,
        }),
      });
      setProfileMessage('プロフィールを保存しました');
      await refresh();
    } catch (err) {
      setProfileMessage(err instanceof Error ? err.message : '保存に失敗しました');
    }
  }

  async function submitEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !file) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('kind', submitKind);
      fd.append('image', file);
      fd.append('turnstile_token', import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ? 'dev-bypass' : 'dev-bypass');
      const res = await fetch(`${api}/submissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd,
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? '提出に失敗しました');
      setMessage(data.message ?? '提出しました');
      setFile(null);
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '提出に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  if (!supabase) {
    return (
      <div className="event-panel">
        <p>イベント API を使うには Supabase の環境変数を設定してください。</p>
      </div>
    );
  }

  if (authLoading) {
    return <p className="event-muted">読み込み中…</p>;
  }

  const rankingUnlocked = Boolean(me?.allMissionsCleared);

  const playToolbar = (
    <div className="event-play-toolbar">
      <a href={landingHref} className="event-back-link">
        イベント概要に戻る
      </a>
      {session ? (
        <div className="event-play-topbar-actions">
          <button
            type="button"
            className={`event-btn event-btn--secondary${rankingUnlocked ? '' : ' event-btn--locked'}`}
            onClick={() => {
              if (rankingUnlocked) setLeaderboardOpen(true);
              else setRankingLockOpen(true);
            }}
            aria-disabled={!rankingUnlocked}
          >
            ランキング
          </button>
          <button type="button" className="event-btn event-btn--secondary" onClick={() => setProfileOpen(true)}>
            プロフィール
          </button>
          <button type="button" className="event-btn event-btn--ghost" onClick={() => void signOut()}>
            ログアウト
          </button>
        </div>
      ) : null}
    </div>
  );

  if (!session) {
    return (
      <div className="event-play-wrap">
        {playToolbar}
        <div className="event-panel event-panel--hero">
          <h2 className="event-panel-title">参加者ログイン</h2>
          <p className="event-lead">Google アカウントでログインしてミッションに参加できます。</p>
          <button type="button" className="event-btn event-btn--primary" onClick={() => void signInWithGoogle()}>
            Google でログイン
          </button>
        </div>
      </div>
    );
  }

  const rankingLockDialog = rankingLockOpen ? (
    <div
      className="event-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-ranking-lock-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setRankingLockOpen(false);
      }}
    >
      <div className="event-notice-dialog">
        <button
          type="button"
          className="event-profile-dialog-close"
          aria-label="閉じる"
          onClick={() => setRankingLockOpen(false)}
        >
          閉じる
        </button>
        <p className="event-notice-kicker">お知らせ</p>
        <p className="event-notice-body event-notice-body--solo" id="event-ranking-lock-title">
          ミッション達成後に解放されます
        </p>
      </div>
    </div>
  ) : null;

  const profileDialog = profileOpen ? (
    <div
      className="event-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-profile-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setProfileOpen(false);
      }}
    >
      <div className="event-profile-dialog">
        <button
          type="button"
          className="event-profile-dialog-close"
          aria-label="閉じる"
          onClick={() => setProfileOpen(false)}
        >
          閉じる
        </button>
        <h2 className="event-panel-title event-profile-modal-title" id="event-profile-title">
          マイプロフィール
        </h2>
        <form className="event-form" onSubmit={(e) => void saveProfile(e)}>
          <label>
            表示名（必須）
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={32} />
          </label>
          <label>
            X（任意）
            <input value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="@なしでも可" />
          </label>
          <label>
            ゲーム内 ID（任意）
            <input value={gameId} onChange={(e) => setGameId(e.target.value)} />
          </label>
          <button type="submit" className="event-btn event-btn--secondary">
            保存
          </button>
        </form>
        {profileMessage && <p className="event-message">{profileMessage}</p>}
      </div>
    </div>
  ) : null;

  return (
    <div className="event-play-wrap">
      {profileDialog}
      {rankingLockDialog}
      <EventLeaderboard slug={slug} open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} />
      {playToolbar}

      <div className="event-play-grid">
      <div className="event-panel event-panel--wide">
        <h2 className="event-panel-title">ミッション進捗</h2>
        {loading && !me ? <p className="event-muted">同期中…</p> : null}
        {error && <p className="event-error">{error}</p>}
        {me && (() => {
          const submissionRows = me.submissions.map((s) => ({
            kind: s.kind as EventMissionKind,
            status: s.status as EventSubmissionStatus,
          }));
          return (
          <ul className="event-mission-list">
            {(['mission_1', 'mission_2', 'mission_3'] as const).map((missionId) => {
              const state = me.missionState[missionId];
              const { current, target } = missionWinProgressFromSubmissions(submissionRows, missionId);
              const fillPct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
              return (
                <li key={missionId} className="event-mission-card">
                  <div className="event-mission-card-head">
                    <span className="event-mission-card-title">
                      {missionKindLabel(missionId, me.profile)}
                    </span>
                    <span className="event-mission-card-progress" aria-label={`勝利数 ${current} / ${target}`}>
                      {current}/{target}
                    </span>
                  </div>
                  <div
                    className="event-mission-progress-track"
                    role="progressbar"
                    aria-valuenow={current}
                    aria-valuemin={0}
                    aria-valuemax={target}
                    aria-label={`${missionKindLabel(missionId, me.profile)} ${current}/${target}`}
                  >
                    <div
                      className={`event-mission-progress-fill event-mission-progress-fill--${state}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          );
        })()}
        {me?.allMissionsCleared && (
          <div className="event-weight-box">
            <p className="event-weight-label">抽選当選比重</p>
            <p className="event-weight-value">{me.lotteryWeight.toFixed(2)}</p>
            <p className="event-muted">追加対戦（承認済み {me.approvedBonusCount} 枚）で +0.01 ずつ上昇</p>
          </div>
        )}
      </div>

      <div className="event-panel event-panel--wide">
        <h2 className="event-panel-title">スクショの提出</h2>
        {!me?.profile ? (
          <p className="event-muted">
            右上の<strong>プロフィール</strong>から表示名を保存してください。
          </p>
        ) : (
          <form className="event-form" onSubmit={(e) => void submitEvidence(e)}>
            <label>
              種別
              <select value={submitKind} onChange={(e) => setSubmitKind(e.target.value as EventMissionKind)}>
                <option value="mission_1">{missionKindLabel('mission_1')}</option>
                <option value="mission_2">{missionKindLabel('mission_2', me.profile)}</option>
                <option value="mission_3">{missionKindLabel('mission_3', me.profile)}</option>
                <option value="bonus_battle" disabled={!me.allMissionsCleared}>
                  {missionKindLabel('bonus_battle')}
                  {!me.allMissionsCleared ? '（全ミッション承認後）' : ''}
                </option>
              </select>
            </label>
            <label>
              スクショ（5MB以下）
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>
            <button type="submit" className="event-btn event-btn--primary" disabled={submitting || !file}>
              {submitting ? '送信中…' : '提出する'}
            </button>
          </form>
        )}
        {message && <p className="event-message">{message}</p>}
      </div>

      {me && me.submissions.length > 0 && (
        <div className="event-panel event-panel--wide">
          <h2 className="event-panel-title">提出履歴</h2>
          <ul className="event-history">
            {me.submissions.map((s) => (
              <li key={s.id}>
                <span>{missionKindLabel(s.kind as EventMissionKind, me.profile)}</span>
                <span className={statusClass(s.status as 'pending' | 'approved' | 'rejected')}>
                  {statusLabel(s.status as 'pending' | 'approved' | 'rejected')}
                </span>
                <time>{new Date(s.created_at).toLocaleString('ja-JP')}</time>
                {s.rejection_reason && <span className="event-reject-reason">理由: {s.rejection_reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
    </div>
  );
}