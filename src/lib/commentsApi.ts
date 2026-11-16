/** Pages Functions のエンドポイント（URL に comments を含めない＝広告ブロック回避） */
export const GUIDE_NOTES_API_PATH = '/api/guide-notes';

/** GET 用（Safari で new URL(relative, origin) が落ちる環境向けに相対 URL） */
export function guideNotesListUrl(articleId: string): string {
  const qs = new URLSearchParams({ article_id: articleId });
  return `${GUIDE_NOTES_API_PATH}?${qs.toString()}`;
}