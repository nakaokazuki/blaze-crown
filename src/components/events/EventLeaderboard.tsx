import { useEffect, useState } from 'react';
import { apiFetch, eventApiBase } from '../../lib/eventApi';

type Props = { slug: string };

export default function EventLeaderboard({ slug }: Props) {
  const [entries, setEntries] = useState<(string | null)[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
  }, [slug]);

  const rows =
    entries ??
    Array.from({ length: 10 }, () => null as string | null);

  return (
    <section className="event-leaderboard event-rules">
      <h2>ランキング</h2>
      {error && <p className="event-error">{error}</p>}
      <ol className="event-leaderboard-list">
        {rows.map((name, i) => (
          <li key={i}>
            <span className="event-leaderboard-rank">{i + 1}</span>
            <span className="event-leaderboard-name">{name ?? 'ー'}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}