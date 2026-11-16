import { useEffect, useState } from 'react';
import type { Comment } from './useComments';

type Props = {
  comments: Comment[];
  loading: boolean;
  error: string | null;
};

const PAGE_SIZE = 20;

export function CommentList({ comments, loading, error }: Props) {
  const [page, setPage] = useState(0);
  const pageCount = Math.ceil(comments.length / PAGE_SIZE);
  const hasPager = comments.length > PAGE_SIZE;

  useEffect(() => {
    const maxPage = Math.max(0, pageCount - 1);
    if (page > maxPage) setPage(maxPage);
  }, [page, pageCount]);

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

  const start = page * PAGE_SIZE;
  const pageComments = comments.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {pageComments.map((c) => (
          <li key={c.id} className="rounded border border-[#ccc] bg-white p-3">
            <p className="text-xs font-bold text-[#444]">
              {c.guest_name ?? 'ゲスト'}
              <span className="ml-2 font-normal text-[#888]">
                {new Date(c.created_at).toLocaleString('ja-JP')}
              </span>
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#333]">{c.body}</p>
          </li>
        ))}
      </ul>
      {hasPager && (
        <nav className="wiki-side-guide-pager" aria-label="コメントのページ">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`wiki-side-guide-pager-btn${i === page ? ' is-active' : ''}`}
              aria-current={i === page ? 'page' : undefined}
              onClick={() => setPage(i)}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}