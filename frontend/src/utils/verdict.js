/**
 * 전략 평가(백엔드 Verdict enum) → 화면 표현.
 * 컴포넌트가 아니라 상수/함수라 별도 파일로 뺐다(react-refresh 규칙).
 */
const VERDICT_STYLE = {
  BAD:     { dot: 'bg-error',   badge: 'badge-error',   bar: 'bg-error',   text: 'N+1 발생' },
  CAUTION: { dot: 'bg-warning', badge: 'badge-warning', bar: 'bg-warning', text: '조건부' },
  GOOD:    { dot: 'bg-success', badge: 'badge-success', bar: 'bg-success', text: '권장' },
};

export function verdictStyle(verdict) {
  return VERDICT_STYLE[verdict] ?? VERDICT_STYLE.CAUTION;
}
