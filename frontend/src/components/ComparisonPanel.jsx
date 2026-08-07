import { verdictStyle } from '../utils/verdict.js';

/**
 * 전략 비교 패널 — 같은 조건으로 모든 전략을 돌려 쿼리 수를 나란히 보여준다.
 *
 * 탭을 하나씩 눌러가며 숫자를 기억할 필요 없이, 한 화면에서 "몇 배 차이인지" 를 보게 하는 것이 목적.
 * 시간(ms)도 함께 싣는데, fetch join 이 쿼리 수는 가장 적으면서도 오히려 더 느릴 수 있다는
 * 반직관적인 사실이 여기서 드러납니다.
 */
export default function ComparisonPanel({ rows, running, onRun, onClose, size }) {
  const max = Math.max(1, ...(rows ?? []).map((r) => r.queryCount));

  return (
    <div className="rounded-xl border border-base-300 bg-base-100 overflow-hidden">
      <div className="px-5 py-4 bg-base-200/40 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-sm">전략 비교</p>
          <p className="text-xs text-base-content/50 mt-0.5">
            같은 조건(page size {size})으로 모든 전략을 실행해 쿼리 수를 비교합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={onRun} disabled={running}>
            {running && <span className="loading loading-spinner loading-xs" />}
            {rows ? '다시 실행' : '비교 실행'}
          </button>
          {rows && (
            <button className="btn btn-ghost btn-sm" onClick={onClose}>닫기</button>
          )}
        </div>
      </div>

      {rows && (
        <div className="px-5 py-4 space-y-3">
          {rows.map((r) => {
            const style = verdictStyle(r.verdict);
            const width = Math.max(3, (r.queryCount / max) * 100);
            return (
              <div key={r.strategy}>
                <div className="flex items-center justify-between gap-3 mb-1 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                    <span className="truncate">{r.label}</span>
                    {r.warnings?.length > 0 && (
                      <span className="tooltip tooltip-right shrink-0" data-tip={r.warnings.join('\n')}>
                        <span className="text-warning">⚠️</span>
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    <span className="text-base-content/40">{r.elapsedMs} ms</span>
                    <span className="font-bold tabular-nums text-base">{r.queryCount}</span>
                    <span className="text-base-content/40">쿼리</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-base-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}

          <p className="text-xs text-base-content/50 pt-2 border-t border-base-200">
            쿼리 수가 가장 적다고 항상 좋은 것은 아닙니다 — ⚠️ 가 붙은 전략은 페이징을 메모리에서 처리하므로
            데이터가 늘어나면 시간·메모리 모두 급격히 나빠집니다. 페이지 크기를 키워가며 다시 실행해 보세요.
          </p>
        </div>
      )}
    </div>
  );
}
