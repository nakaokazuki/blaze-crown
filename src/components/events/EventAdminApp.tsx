import { useCallback, useEffect, useState } from 'react';
import { apiFetch, eventApiBase } from '../../lib/eventApi';
import { missionKindLabel, type EventMissionKind } from '../../lib/events';
import { statusClass, statusLabel } from './statusLabels';
import { useEventSession } from './useEventSession';

type Participant = {
  user_id: string;
  email: string | null;
  display_name: string;
  x_handle: string | null;
  game_id: string | null;
  assigned_char_a: string;
  assigned_char_b: string;
  created_at: string;
  missionState: Record<string, string>;
  allMissionsCleared: boolean;
  approvedBonusCount: number;
  lotteryWeight: number;
  pendingSubmissions: number;
};

type Submission = {
  id: string;
  user_id: string;
  kind: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  profile: { display_name: string; x_handle: string | null; game_id: string | null } | null;
};

type Props = { slug: string };

export default function EventAdminApp({ slug }: Props) {
  const { session, accessToken, loading: authLoading, signInWithGoogle, supabase } = useEventSession();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const api = eventApiBase(slug);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const [pRes, sRes] = await Promise.all([
        apiFetch<{ participants: Participant[] }>(`${api}/admin/participants`, { accessToken }),
        apiFetch<{ submissions: Submission[] }>(`${api}/admin/submissions?status=pending`, { accessToken }),
      ]);
      setParticipants(pRes.participants);
      setSubmissions(sRes.submissions);
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込み失敗');
    }
  }, [accessToken, api]);

  useEffect(() => {
    if (accessToken) void load();
  }, [accessToken, load]);

  async function review(id: string, action: 'approve' | 'reject') {
    if (!accessToken) return;
    try {
      await apiFetch(`${api}/admin/submissions/${id}`, {
        method: 'PATCH',
        accessToken,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejection_reason: action === 'reject' ? rejectReason[id] ?? '' : undefined,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失敗');
    }
  }

  async function openImage(id: string) {
    if (!accessToken) return;
    try {
      const data = await apiFetch<{ url: string }>(`${api}/submissions/${id}/image`, { accessToken });
      setPreviewUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '画像取得失敗');
    }
  }

  function exportCsv() {
    const cleared = participants.filter((p) => p.allMissionsCleared);
    const header = ['display_name', 'email', 'lottery_weight'];
    const lines = [
      header.join(','),
      ...cleared.map((p) =>
        [p.display_name, p.email ?? '', p.lotteryWeight].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-${slug}-weights.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!supabase) {
    return <p>Supabase 未設定</p>;
  }

  if (authLoading) return <p className="event-muted">読み込み中…</p>;

  if (!session) {
    return (
      <div className="event-panel">
        <p>運営者は Google でログインしてください。</p>
        <button type="button" className="event-btn event-btn--primary" onClick={() => void signInWithGoogle()}>
          Google でログイン
        </button>
      </div>
    );
  }

  const filtered = participants.filter((p) =>
    filter ? p.display_name.toLowerCase().includes(filter.toLowerCase()) : true,
  );

  return (
    <div className="event-admin-stack">
      {error && <p className="event-error">{error}</p>}

      <section className="event-panel event-panel--wide">
        <div className="event-panel-head">
          <h2 className="event-panel-title">審査キュー（pending）</h2>
          <button type="button" className="event-btn event-btn--ghost" onClick={() => void load()}>
            更新
          </button>
        </div>
        {submissions.length === 0 ? (
          <p className="event-muted">審査待ちはありません</p>
        ) : (
          <ul className="event-review-list">
            {submissions.map((s) => (
              <li key={s.id} className="event-review-card">
                <div className="event-review-meta">
                  <strong>{s.profile?.display_name ?? s.user_id}</strong>
                  <span>{missionKindLabel(s.kind as EventMissionKind)}</span>
                  <time>{new Date(s.created_at).toLocaleString('ja-JP')}</time>
                </div>
                <button type="button" className="event-btn event-btn--secondary" onClick={() => void openImage(s.id)}>
                  画像を見る
                </button>
                <div className="event-review-actions">
                  <button
                    type="button"
                    className="event-btn event-btn--primary"
                    onClick={() => void review(s.id, 'approve')}
                  >
                    承認
                  </button>
                  <input
                    placeholder="差し戻し理由"
                    value={rejectReason[s.id] ?? ''}
                    onChange={(e) => setRejectReason((prev) => ({ ...prev, [s.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="event-btn event-btn--danger"
                    onClick={() => void review(s.id, 'reject')}
                  >
                    差し戻し
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="event-panel event-panel--wide">
        <div className="event-panel-head">
          <h2 className="event-panel-title">登録ユーザー一覧</h2>
          <button type="button" className="event-btn event-btn--secondary" onClick={exportCsv}>
            達成者 CSV
          </button>
        </div>
        <input
          className="event-search"
          placeholder="表示名で検索"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="event-table-wrap">
          <table className="event-table">
            <thead>
              <tr>
                <th>表示名</th>
                <th>メール</th>
                <th>M1</th>
                <th>M2</th>
                <th>M3</th>
                <th>達成</th>
                <th>比重</th>
                <th>待ち</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.user_id}>
                  <td>{p.display_name}</td>
                  <td className="event-table-email">{p.email ?? '—'}</td>
                  <td>
                    <span className={statusClass(p.missionState.mission_1 as 'none' | 'pending' | 'approved' | 'rejected')}>
                      {statusLabel(p.missionState.mission_1 as 'none' | 'pending' | 'approved' | 'rejected')}
                    </span>
                  </td>
                  <td>
                    <span className={statusClass(p.missionState.mission_2 as 'none' | 'pending' | 'approved' | 'rejected')}>
                      {statusLabel(p.missionState.mission_2 as 'none' | 'pending' | 'approved' | 'rejected')}
                    </span>
                  </td>
                  <td>
                    <span className={statusClass(p.missionState.mission_3 as 'none' | 'pending' | 'approved' | 'rejected')}>
                      {statusLabel(p.missionState.mission_3 as 'none' | 'pending' | 'approved' | 'rejected')}
                    </span>
                  </td>
                  <td>{p.allMissionsCleared ? '◎' : '—'}</td>
                  <td>{p.lotteryWeight.toFixed(2)}</td>
                  <td>{p.pendingSubmissions > 0 ? p.pendingSubmissions : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {previewUrl && (
        <hr />
      )}
      {previewUrl && (
        <div className="event-modal" role="dialog">
          <button type="button" className="event-modal-close" onClick={() => setPreviewUrl(null)}>
            閉じる
          </button>
          <img src={previewUrl} alt="提出画像" className="event-modal-img" />
        </div>
      )}
    </div>
  );
}