import { useEffect, useState } from 'react';
import { apiFetch, eventApiBase } from '../../lib/eventApi';

type Props = {
  slug: string;
  open: boolean;
  onClose: () => void;
};

export default function EventLeaderboard({ slug, open, onClose }: Props) {
  const [entries, setEntries] = useState<(string | null)[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setEntries(null);
    setError(null);
    void (async () => {
      try {
        const data = await apiFetch<{ entries: (string | null)[] }>(`${eventApiBase(slug)}/leaderboard`);
        if (!cancelled) setEntries(data.entries);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'ランキング取得失敗');
          setEntries(Array.from({ length: 10 }, () => null));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, open]);

  if (!open) return null;

  const rows = entries ?? Array.from({ length: 10 }, () => null as string | null);

  return (
    <div
      className="event-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-leaderboard-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="event-profile-dialog event-leaderboard-dialog">
        <button type="button" className="event-profile-dialog-close" aria-label="閉じる" onClick={onClose}>
          閉じる
        </button>
        <h2 className="event-panel-title event-leaderboard-title" id="event-leaderboard-title">
          ランキング
        </h2>
        <p className="event-muted event-leaderboard-note">
          ミッション全達成後に承認された追加スクショの枚数が多い順（TOP10・表示名のみ）
        </p>
        {error && <p className="event-error">{error}</p>}
        {entries === null && !error ? <p className="event-muted">読み込み中…</p> : null}
        <ol className="event-leaderboard-list">
          {rows.map((name, i) => (
            <li key={i}>
              <span className="event-leaderboard-rank">{i + 1}</span>
              <span className="event-leaderboard-name">{name ?? 'ー'}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}