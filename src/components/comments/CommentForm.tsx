import { useState } from 'react';
import { GUIDE_NOTES_API_PATH } from '../../lib/commentsApi';

type Props = {
  articleId: string;
  onSubmitted: () => void;
};

const fieldClass =
  'mt-1 w-full rounded border border-[#ccc] bg-white px-3 py-2 text-base text-[#222]';

export function CommentForm({ articleId, onSubmitted }: Props) {
  const [guestName, setGuestName] = useState('');
  const [body, setBody] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const turnstileKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(GUIDE_NOTES_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: articleId,
          body: body.trim(),
          guest_name: guestName.trim() || 'ゲスト',
          turnstile_token: turnstileKey ? 'dev-bypass' : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? '投稿に失敗しました');
      setBody('');
      setMessage(data.message ?? '投稿しました。');
      onSubmitted();
      window.setTimeout(() => onSubmitted(), 400);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <label className="block text-sm font-bold text-[#222]">
          表示名
          <input
            className={fieldClass}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            maxLength={32}
          />
        </label>
        <label className="block text-sm font-bold text-[#222]">
          コメント
          <textarea
            className={fieldClass}
            rows={5}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded border border-[#e5a10a] bg-[#ffb11b] px-4 py-2 text-sm font-bold text-[#222] disabled:opacity-50"
        >
          {submitting ? '送信中…' : '投稿する'}
        </button>
      </form>
      {message && <p className="text-sm text-[#333]">{message}</p>}
    </div>
  );
}