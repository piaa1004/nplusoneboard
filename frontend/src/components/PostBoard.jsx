import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loadPosts, runComparison,
  setStrategy, setPage, setSize, clearComparison,
} from '../store/postSlice.js';
import StrategyTabs from './StrategyTabs.jsx';
import StrategyNote from './StrategyNote.jsx';
import QueryReport from './QueryReport.jsx';
import ComparisonPanel from './ComparisonPanel.jsx';
import PostTable from './PostTable.jsx';

const SIZE_OPTIONS = [5, 10, 20, 50, 100];

/**
 * 게시글 목록 화면 — 1:N({@code Post.comments}) 방향 N+1 데모.
 *
 * 왼쪽에는 어떤 전략을 골라도 똑같은 게시글 표가, 오른쪽에는 그 표를 만드느라 실행된 SQL 이 뜹니다.
 * "화면은 같은데 비용은 몇 배" 라는 대비가 이 화면의 전부이므로,
 * 결과를 바꿀 수 있는 조작은 <b>전략</b>과 <b>페이지 크기</b> 둘로 제한했습니다.
 */
export default function PostBoard() {
  const dispatch = useDispatch();
  const strategies = useSelector((s) => s.strategies.posts);
  const {
    report, loading, error,
    strategy, page, size,
    comparison, comparing,
  } = useSelector((s) => s.posts);

  useEffect(() => {
    dispatch(loadPosts({ strategy, page, size }));
  }, [strategy, page, size, dispatch]);

  const info = strategies.find((s) => s.code === strategy);
  const meta = report?.page;
  const totalPages = meta?.totalPages ?? 0;
  const current = meta?.number ?? 0;

  const windowSize = 5;
  const start = Math.max(0, Math.min(current - 2, totalPages - windowSize));
  const numbers = [];
  for (let i = start; i < Math.min(totalPages, start + windowSize); i++) numbers.push(i);

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

          {/* 툴바 — 조작할 수 있는 건 페이지 크기뿐이다 */}
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-base-content/60 font-medium">페이지 크기</span>
              <select
                className="select select-bordered select-sm w-24"
                value={size}
                onChange={(e) => dispatch(setSize(Number(e.target.value)))}
              >
                {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className="text-xs text-base-content/40">
                크기를 키우면 N+1 의 N 이 그대로 커집니다
              </span>
            </div>
            {meta && (
              <span className="text-sm text-base-content/50">
                총 <strong className="text-base-content/80">{meta.totalElements.toLocaleString()}</strong>건 ·{' '}
                <strong className="text-base-content/80">{current + 1}</strong> / {Math.max(totalPages, 1)} 페이지
              </span>
            )}
          </div>

          {error && (
            <div className="alert alert-error mb-3 text-sm"><span>에러: {error}</span></div>
          )}

          {/* 표 + 리포트 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
            <PostTable posts={report?.content ?? []} />
            <QueryReport report={report} loading={loading} />
          </div>

          {/* 페이지네이션 */}
          <div className="flex justify-center mt-5">
            <div className="join shadow-sm">
              <button className="join-item btn btn-sm btn-ghost" disabled={current <= 0} onClick={() => dispatch(setPage(0))}>«</button>
              <button className="join-item btn btn-sm btn-ghost" disabled={current <= 0} onClick={() => dispatch(setPage(current - 1))}>‹</button>
              {numbers.map((n) => (
                <button
                  key={n}
                  className={`join-item btn btn-sm ${n === current ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => dispatch(setPage(n))}
                >
                  {n + 1}
                </button>
              ))}
              <button className="join-item btn btn-sm btn-ghost" disabled={current >= totalPages - 1} onClick={() => dispatch(setPage(current + 1))}>›</button>
              <button className="join-item btn btn-sm btn-ghost" disabled={current >= totalPages - 1} onClick={() => dispatch(setPage(totalPages - 1))}>»</button>
            </div>
          </div>
        </div>
      </div>

      <ComparisonPanel
        rows={comparison}
        running={comparing}
        size={size}
        onRun={() => dispatch(runComparison({ page, size }))}
        onClose={() => dispatch(clearComparison())}
      />
    </div>
  );
}
