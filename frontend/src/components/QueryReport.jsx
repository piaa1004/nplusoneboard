import { useState } from 'react';

/**
 * 같은 SQL 이 반복해서 나간 것을 묶는다. N+1 의 지문(fingerprint)은
 * "동일한 select 가 파라미터만 바뀌며 여러 번 반복" 이므로, 묶어서 보여주면 한눈에 드러난다.
 */
function groupQueries(queries) {
  const groups = [];
  queries.forEach((sql) => {
    const last = groups[groups.length - 1];
    if (last && last.sql === sql) {
      last.count += 1;
    } else {
      groups.push({ sql, count: 1 });
    }
  });
  return groups;
}

/** SQL 을 대략적으로 분류해 배지를 붙인다. */
function classify(sql) {
  const lower = sql.toLowerCase();
  if (lower.startsWith('select count(')) return { text: 'COUNT', className: 'badge-ghost' };
  if (lower.includes('from comment')) return { text: 'COMMENT', className: 'badge-secondary badge-outline' };
  if (lower.includes('from post')) return { text: 'POST', className: 'badge-primary badge-outline' };
  return { text: 'SQL', className: 'badge-ghost' };
}

/**
 * 조회 리포트 패널 — 이 데모의 핵심 화면.
 *
 * 게시글 목록은 어떤 전략을 골라도 똑같이 보이기 때문에, 차이가 드러나는 곳은 여기뿐입니다.
 * "쿼리 몇 개가 나갔는가" 를 크게 띄우고, 반복된 SQL 을 묶어 N+1 의 모양을 그대로 보여줍니다.
 */
export default function QueryReport({ report, loading }) {
  const [open, setOpen] = useState(true);

  if (!report) {
    return (
      <div className="rounded-xl border border-base-300 bg-base-100 p-5">
        <div className="skeleton h-5 w-32 rounded mb-3" />
        <div className="skeleton h-16 w-full rounded" />
      </div>
    );
  }

  const groups = groupQueries(report.queries);
  const repeated = groups.filter((g) => g.count > 1);
  const nPlusOne = repeated.some((g) => g.count >= 3);
  const warnings = report.warnings ?? [];

  return (
    <div className={`rounded-xl border bg-base-100 overflow-hidden transition-colors
      ${nPlusOne ? 'border-error/40' : 'border-base-300'}`}>

      {/* 헤더 — 쿼리 수를 크게 */}
      <div className={`px-5 py-4 flex items-center justify-between gap-4 flex-wrap
        ${nPlusOne ? 'bg-error/5' : 'bg-base-200/40'}`}>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold tabular-nums ${nPlusOne ? 'text-error' : 'text-success'}`}>
            {report.queryCount}
          </span>
          <span className="text-sm text-base-content/60">번의 SQL 이 실행되었습니다</span>
          {loading && <span className="loading loading-spinner loading-xs text-primary ml-1" />}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {nPlusOne && (
            <span className="badge badge-error gap-1 font-semibold">
              ⚠ N+1 감지
            </span>
          )}
          <span className="badge badge-ghost font-mono">{report.elapsedMs} ms</span>
        </div>
      </div>

      {/* Hibernate 경고 */}
      {warnings.length > 0 && (
        <div className="px-5 py-3 bg-warning/10 border-t border-warning/30">
          {warnings.map((w, i) => (
            <p key={i} className="text-xs text-base-content/80 flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>
                <span className="font-mono">{w}</span>
                {w.includes('applying in memory') && (
                  <span className="block mt-1 text-base-content/70">
                    → 조건에 맞는 행을 <b>전부 읽어와 애플리케이션 메모리에서 페이징</b>했다는 뜻입니다.
                    쿼리 수는 적지만 데이터가 커지면 그대로 OOM 으로 이어집니다.
                  </span>
                )}
              </span>
            </p>
          ))}
        </div>
      )}

      {/* SQL 목록 */}
      <div className="border-t border-base-300">
        <button
          className="w-full px-5 py-2.5 flex items-center gap-2 text-xs font-semibold text-base-content/60 hover:bg-base-200/50 transition-colors"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
          실행된 SQL {groups.length}종류
          {repeated.length > 0 && (
            <span className="badge badge-error badge-xs">
              반복 {repeated.reduce((sum, g) => sum + g.count, 0)}회
            </span>
          )}
        </button>

        {open && (
          <ul className="px-4 pb-4 space-y-1.5 max-h-96 overflow-y-auto">
            {groups.map((g, i) => {
              const kind = classify(g.sql);
              return (
                <li
                  key={i}
                  className={`rounded-lg px-3 py-2 text-[11px] font-mono leading-relaxed break-all
                    ${g.count > 1 ? 'bg-error/10 border border-error/30' : 'bg-base-200/60'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge badge-xs ${kind.className}`}>{kind.text}</span>
                    {g.count > 1 && (
                      <span className="badge badge-error badge-xs font-bold">× {g.count}</span>
                    )}
                  </div>
                  <span className="text-base-content/70">{g.sql}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
