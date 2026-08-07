import { useState } from 'react';
import { formatDate, createComment, deleteComment } from '../api.js';

const MY_COMMENTS_KEY = 'nplusone-board-demo:my-comment-ids';

function getIdSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(MY_COMMENTS_KEY)) ?? []);
  } catch {
    return new Set();
  }
}

function setIdSet(ids) {
  localStorage.setItem(MY_COMMENTS_KEY, JSON.stringify([...ids]));
}

/**
 * 댓글 목록 + 작성/삭제.
 *
 * 목록은 상세 조회 응답에 이미 들어 있으므로 따로 받아오지 않습니다(불필요한 왕복 제거).
 * 작성·삭제 후에는 부모가 상세를 다시 조회하며, 그때 쿼리 리포트도 함께 갱신됩니다.
 */
export default function CommentSection({ postId, comments, onChanged }) {
  const [error, setError] = useState(null);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myCommentIds, setMyCommentIds] = useState(getIdSet);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!author.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createComment(postId, { author, content });
      const ids = new Set(myCommentIds).add(created.id);
      setIdSet(ids);
      setMyCommentIds(ids);
      setContent('');
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(postId, commentId);
      const ids = new Set(myCommentIds);
      ids.delete(commentId);
      setIdSet(ids);
      setMyCommentIds(ids);
      onChanged();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="mt-6 border-t border-base-200 pt-5">
      <h4 className="font-semibold text-sm mb-3">💬 댓글 ({comments.length})</h4>

      {error && (
        <div className="alert alert-error mb-3 py-2 text-sm"><span>{error}</span></div>
      )}

      {comments.length === 0 && (
        <p className="text-sm text-base-content/40 mb-3">
          아직 댓글이 없습니다. 댓글을 달면 목록 화면의 댓글 수와 쿼리 결과에도 바로 반영됩니다.
        </p>
      )}

      {comments.length > 0 && (
        <ul className="flex flex-col gap-3 mb-4">
          {comments.map((c) => (
            <li key={c.id} className="text-sm border border-base-200 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{c.author}</span>
                <div className="flex items-center gap-2 text-xs text-base-content/40">
                  <span>{formatDate(c.createdAt)}</span>
                  {myCommentIds.has(c.id) && (
                    <button className="link link-hover text-error" onClick={() => handleDelete(c.id)}>
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1 text-base-content/80 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="이름"
          className="input input-sm input-bordered w-full sm:w-40"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={50}
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="댓글을 입력하세요"
            className="input input-sm input-bordered flex-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
          />
          <button type="submit" className="btn btn-sm btn-primary" disabled={submitting}>
            등록
          </button>
        </div>
      </form>
    </div>
  );
}
