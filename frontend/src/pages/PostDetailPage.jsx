import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDate, fetchPost } from '../api.js';
import CommentSection from '../components/CommentSection.jsx';
import QueryReport from '../components/QueryReport.jsx';

/**
 * 게시글 상세 — <b>N+1 의 대조군</b>.
 *
 * 부모가 1건이므로 지연 로딩이어도 게시글 1 + 댓글 1 = 2쿼리로 끝납니다.
 * fetch join 토글을 켜면 1쿼리가 되는데, 목록 화면의 12쿼리와 대비해서 보면
 * "N+1 은 부모를 여러 건 조회할 때만 생긴다" 는 점이 분명해집니다.
 */
export default function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [fetchJoin, setFetchJoin] = useState(false);
  // 댓글 작성·삭제 후 상세를 다시 읽기 위한 재조회 트리거.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    fetchPost(postId, fetchJoin)
      .then((r) => { if (!cancelled) { setReport(r); setError(null); } })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [postId, fetchJoin, reloadKey]);

  const post = report?.content;

  return (
    <div className="min-h-screen bg-base-200">
      <header className="bg-primary text-primary-content shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link to="/" className="text-primary-content/70 text-sm hover:text-primary-content">
            ← 목록으로
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">🔍 게시글 상세</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          <div className="lg:col-span-2 card bg-base-100 shadow-sm border border-base-300">
            <div className="bg-primary/5 border-b border-base-300 px-6 py-4">
              {post ? (
                <>
                  <h3 className="font-bold text-lg leading-snug">{post.title}</h3>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-base-content/50">
                    <span>✍️ {post.author}</span>
                    <span>🕐 {formatDate(post.createdAt)}</span>
                    <span>💬 {post.comments.length}</span>
                  </div>
                </>
              ) : (
                <div className="h-6 w-48 skeleton rounded" />
              )}
            </div>

            <div className="px-6 py-5">
              {error && <div className="alert alert-error"><span>{error}</span></div>}
              {!post && !error && (
                <div className="flex flex-col gap-3">
                  <div className="skeleton h-4 w-full rounded" />
                  <div className="skeleton h-4 w-5/6 rounded" />
                  <div className="skeleton h-4 w-4/6 rounded" />
                </div>
              )}
              {post && <pre className="modal-content text-base-content/80">{post.content}</pre>}
              {post && <CommentSection postId={postId} comments={post.comments} onChanged={reload} />}
            </div>
          </div>

          {/* 사이드 — 이 화면의 조회 리포트 */}
          <div className="space-y-4">
            <div className="rounded-xl border border-base-300 bg-base-100 px-5 py-4">
              <p className="font-bold text-sm mb-1">단건 조회는 N+1 이 아닙니다</p>
              <p className="text-xs text-base-content/60 leading-relaxed mb-3">
                부모가 1건이면 컬렉션 초기화도 한 번뿐이라 지연 로딩이어도 총 2쿼리입니다.
                fetch join 을 켜면 1쿼리가 되고, 여기서는 <b>페이징이 없으니 메모리 페이징 문제도 없습니다</b>.
              </p>
              <label className="label cursor-pointer justify-start gap-3 p-0">
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-sm"
                  checked={fetchJoin}
                  onChange={(e) => setFetchJoin(e.target.checked)}
                />
                <span className="text-sm font-medium">
                  join fetch 로 한 번에 읽기
                </span>
              </label>
            </div>

            <QueryReport report={report} />
          </div>
        </div>

        <button className="btn btn-ghost btn-sm mt-4" onClick={() => navigate(-1)}>
          ← 이전으로
        </button>
      </div>
    </div>
  );
}
