import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  loadComments, runCommentComparison,
  setStrategy, setPage, setSize, setSort, clearComparison,
} from '../store/commentSlice.js';
import { formatDate } from '../api.js';
import StrategyTabs from './StrategyTabs.jsx';
import StrategyNote from './StrategyNote.jsx';
import QueryReport from './QueryReport.jsx';
import ComparisonPanel from './ComparisonPanel.jsx';

const SIZE_OPTIONS = [5, 10, 20, 50];

/**
 * 정렬 옵션을 굳이 제공하는 이유:
 * 한 페이지에 담기는 "서로 다른 게시글 수" 를 바꾸기 위해서다.
 * 최신순이면 같은 게시글의 댓글이 몰려 있어 1차 캐시가 잘 먹지만(추가 쿼리 적음),
 * 내용순으로 섞으면 게시글이 흩어지면서 추가 쿼리가 페이지 크기에 가깝게 늘어난다.
 */
const SORT_OPTIONS = [
  { value: 'id,desc',      label: '최신 댓글순',   hint: '같은 게시글의 댓글이 뭉쳐 있어 1차 캐시가 잘 먹습니다' },
  { value: 'author,asc',   label: '작성자순',      hint: '게시글이 적당히 섞입니다' },
  { value: 'content,asc',  label: '댓글 내용순',   hint: '게시글이 최대로 흩어져 N+1 이 선명해집니다' },
];

/**
 * 최근 댓글 화면 — N:1({@code Comment.post}) 방향 N+1 데모.
 *
 * 게시글 목록(1:N)과 짝을 이루는 화면입니다. 같은 양방향 관계인데도
 * N:1 쪽은 fetch join 과 페이징을 함께 써도 안전하다는 점이 결정적인 차이입니다.
 */
export default function CommentBoard() {
  const dispatch = useDispatch();
  const strategies = useSelector((s) => s.strategies.comments);
  const {
    report, loading, error,
    strategy, page, size, sort,
    comparison, comparing,
  } = useSelector((s) => s.comments);

  useEffect(() => {
    dispatch(loadComments({ strategy, page, size, sort }));
  }, [strategy, page, size, sort, dispatch]);

  const info = strategies.find((s) => s.code === strategy);
  const meta = report?.page;
  const totalPages = meta?.totalPages ?? 0;
  const current = meta?.number ?? 0;
  const rows = report?.content ?? [];
  const distinctPosts = new Set(rows.map((c) => c.postId)).size;
  const sortHint = SORT_OPTIONS.find((o) => o.value === sort)?.hint;

  return (
    <div className="space-y-5">
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="border-b border-base-300 px-5 pt-4">
          <StrategyTabs
            strategies={strategies}
            current={strategy}
            onSelect={(code) => dispatch(setStrategy(code))}
          />
        </div>

        <div className="card-body p-5">
          <StrategyNote info={info} />

          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <span className="text-base-content/60 font-medium">정렬</span>
              <select
                className="select select-bordered select-sm"
                value={sort}
                onChange={(e) => dispatch(setSort(e.target.value))}
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <span className="text-base-content/60 font-medium ml-2">크기</span>
              <select
                className="select select-bordered select-sm w-20"
                value={size}
                onChange={(e) => dispatch(setSize(Number(e.target.value)))}
              >
                {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {rows.length > 0 && (
              <span className="text-sm text-base-content/50">
                이 페이지의 서로 다른 게시글{' '}
                <strong className="text-base-content/80">{distinctPosts}</strong>개
              </span>
            )}
          </div>

          {sortHint && (
            <p className="text-xs text-base-content/45 -mt-1 mb-3">💡 {sortHint}</p>
          )}

          {error && (
            <div className="alert alert-error mb-3 text-sm"><span>에러: {error}</span></div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <div className="overflow-x-auto rounded-xl border border-base-300">
              <table className="table table-sm w-full">
                <thead className="bg-base-200/60 text-xs uppercase tracking-wide text-base-content/60">
                  <tr>
                    <th className="col-id py-3">NO</th>
                    <th>댓글</th>
                    <th className="col-author">작성자</th>
                    <th>게시글</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-base-content/30 text-sm">
                        댓글이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    rows.map((c) => (
                      <tr key={c.id} className="border-b border-base-200 last:border-0">
                        <td className="col-id text-xs text-base-content/30 font-mono">{c.id}</td>
                        <td className="text-sm">
                          <span className="line-clamp-2">{c.content}</span>
                          <span className="block text-[11px] text-base-content/35 font-mono mt-0.5">
                            {formatDate(c.createdAt)}
                          </span>
                        </td>
                        <td className="col-author text-sm text-base-content/70">{c.author}</td>
                        <td className="text-xs">
                          <Link to={`/posts/${c.postId}`} className="post-title-link line-clamp-2">
                            {c.postTitle}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <QueryReport report={report} loading={loading} />
          </div>

          <div className="flex justify-center mt-5">
            <div className="join shadow-sm">
              <button className="join-item btn btn-sm btn-ghost" disabled={current <= 0} onClick={() => dispatch(setPage(current - 1))}>‹ 이전</button>
              <button className="join-item btn btn-sm btn-ghost pointer-events-none">
                {current + 1} / {Math.max(totalPages, 1)}
              </button>
              <button className="join-item btn btn-sm btn-ghost" disabled={current >= totalPages - 1} onClick={() => dispatch(setPage(current + 1))}>다음 ›</button>
            </div>
          </div>
        </div>
      </div>

      <ComparisonPanel
        rows={comparison}
        running={comparing}
        size={size}
        onRun={() => dispatch(runCommentComparison({ page, size, sort }))}
        onClose={() => dispatch(clearComparison())}
      />
    </div>
  );
}
