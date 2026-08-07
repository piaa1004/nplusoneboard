import { verdictStyle } from '../utils/verdict.js';

/** 전략 탭 — 백엔드가 내려준 카탈로그로 그린다. 평가(BAD/CAUTION/GOOD)를 색 점으로 표시. */
export default function StrategyTabs({ strategies, current, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1">
      {strategies.map((s) => {
        const active = s.code === current;
        const style = verdictStyle(s.verdict);
        return (
          <button
            key={s.code}
            onClick={() => onSelect(s.code)}
            className={`px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2
              ${active
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-base-content/50 hover:text-base-content hover:bg-base-200'
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${style.dot} ${active ? '' : 'opacity-50'}`} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
