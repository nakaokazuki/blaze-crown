import type { Comment } from './useComments';

type Props = {
  comments: Comment[];
  loading: boolean;
  error: string | null;
};

export function CommentList({ comments, loading, error }: Props) {
  if (loading) {
    return <p className="text-sm text-[#666]">コメントを読み込み中…</p>;
  }

  if (error) {
    return (
      <p className="rounded border border-[#e5a10a] bg-[#fff5d6] px-3 py-2 text-sm text-[#333]">
        {error}
      </p>
    );
  }

  if (comments.length === 0) {
    return <p className="text-sm text-[#666]">まだコメントはありません。</p>;
  }

  return (
    <ul className="space-y-2">
      {comments.map((c) => (
        <li key={c.id} className="rounded border border-[#ccc] bg-white p-3">
          <p className="text-xs font-bold text-[#444]">
            {c.guest_name ?? 'ログインユーザー'}
            <span className="ml-2 font-normal text-[#888]">
              {new Date(c.created_at).toLocaleString('ja-JP')}
            </span>
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#333]">{c.body}</p>
        </li>
      ))}
    </ul>
  );
}
