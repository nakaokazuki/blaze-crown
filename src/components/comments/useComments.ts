import { useCallback, useEffect, useState } from 'react';
import { GUIDE_NOTES_API_PATH } from '../../lib/commentsApi';

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
      if (!articleId) {
        throw new Error('記事 ID が不明です');
      }
      const url = new URL(GUIDE_NOTES_API_PATH, window.location.origin);
      url.searchParams.set('article_id', articleId);
      const res = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        comments?: Comment[];
        error?: string;
        warning?: string;
      };
      if (!res.ok) {
        const detail = data.error ?? data.warning;
        throw new Error(
          detail
            ? `${detail}（HTTP ${res.status}）`
            : `コメントを読み込めませんでした（HTTP ${res.status}）`,
        );
      }
      setComments(data.comments ?? []);
      if (data.warning && !(data.comments?.length)) {
        setError(data.warning);
      }
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