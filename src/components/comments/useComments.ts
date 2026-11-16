import { useCallback, useEffect, useState } from 'react';

export type Comment = {
  id: string;
  article_id: string;
  guest_name: string | null;
  body: string;
  created_at: string;
};

const FETCH_TIMEOUT_MS = 15_000;

export function useComments(articleId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/comments?article_id=${encodeURIComponent(articleId)}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('コメントを読み込めませんでした');
      const data = (await res.json()) as { comments: Comment[] };
      setComments(data.comments ?? []);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        setError('コメントの読み込みがタイムアウトしました。再読み込みしてください。');
      } else {
        setError(
          e instanceof Error
            ? e.message
            : 'コメント API に接続できません（本番は Cloudflare Functions）',
        );
      }
      setComments([]);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { comments, loading, error, refresh };
}