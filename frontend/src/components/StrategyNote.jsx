import { useState } from 'react';
import { verdictStyle } from '../utils/verdict.js';

/**
 * 선택한 전략의 설명 카드.
 * 문구·코드 스니펫은 전부 백엔드 enum(PostStrategy / CommentStrategy)에서 내려온 값이다.
 */
export default function StrategyNote({ info }) {
  const [showCode, setShowCode] = useState(false);
  if (!info) return null;

  const style = verdictStyle(info.verdict);

  return (
    <div className="rounded-xl bg-base-200/50 border border-base-300 px-5 py-4 mb-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`badge ${style.badge} badge-sm font-semibold`}>{style.text}</span>
        <span className="font-bold text-sm">{info.label}</span>
        <span className="badge badge-ghost badge-sm font-mono">예상 쿼리 {info.expected}</span>
      </div>

      <p className="text-sm text-base-content/80 mb-3">{info.headline}</p>

      <ul className="space-y-1 mb-3">
        {info.points.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-base-content/65">
            <span className="text-primary mt-0.5 shrink-0">›</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <button
        className="btn btn-xs btn-ghost gap-1 -ml-2"
        onClick={() => setShowCode((v) => !v)}
      >
        <span className={`transition-transform ${showCode ? 'rotate-90' : ''}`}>▸</span>
        코드 보기
      </button>

      {showCode && (
        <pre className="mt-2 bg-neutral text-neutral-content rounded-lg p-4 text-xs overflow-x-auto leading-relaxed">
          {info.snippet}
        </pre>
      )}
    </div>
  );
}
