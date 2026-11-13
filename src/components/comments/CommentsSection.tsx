import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { useComments } from './useComments';

type Props = {
  articleId: string;
};

export default function CommentsSection({ articleId }: Props) {
  const { comments, loading, error, refresh } = useComments(articleId);

  return (
    <div id="comments">
      <h2 className="section-title mb-6 border-0 pb-0 text-xl">コメント</h2>
      <CommentList comments={comments} loading={loading} error={error} />
      <div className="mt-8 border-t-2 border-zinc-200 pt-8">
        <CommentForm articleId={articleId} onSubmitted={() => void refresh()} />
      </div>
    </div>
  );
}
