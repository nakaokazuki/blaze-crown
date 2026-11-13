import { useCallback, useEffect, useState } from 'react';

export type Comment = {
  id: string;
  article_id: string;
  guest_name: string | null;
  body: string;
  created_at: string;
};

export function useComments(articleId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?article_id=${encodeURIComponent(articleId)}`);
      if (!res.ok) throw new Error('コメントを読み込めませんでした');
      const data = (await res.json()) as { comments: Comment[] };
      setComments(data.comments ?? []);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'コメント API に接続できません（本番は Cloudflare Functions）',
      );
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { comments, loading, error, refresh };
}
