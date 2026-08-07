import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadStrategies } from '../store/strategySlice.js';
import PostBoard from '../components/PostBoard.jsx';
import CommentBoard from '../components/CommentBoard.jsx';
import ConceptPanel from '../components/ConceptPanel.jsx';

const TABS = [
  { id: 'posts',    label: '게시글 목록', sub: '1:N · Post → Comment' },
  { id: 'comments', label: '최근 댓글',   sub: 'N:1 · Comment → Post' },
  { id: 'concept',  label: '개념 정리',   sub: '단방향 vs 양방향' },
];

export default function BoardHome() {
  const dispatch = useDispatch();
  const strategyError = useSelector((s) => s.strategies.error);
  const [tab, setTab] = useState('posts');

  // 전략 카탈로그(탭 이름·설명)는 백엔드에서 한 번만 받아온다.
  useEffect(() => {
    dispatch(loadStrategies());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-base-200">
      <header className="bg-primary text-primary-content shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-end gap-3 mb-1">
            <span className="text-3xl">🔍</span>
            <h1 className="text-2xl font-extrabold tracking-tight">게시판 · JPA N+1 문제 데모</h1>
          </div>
          <p className="text-primary-content/70 text-sm mt-1">
            Post ↔ Comment <b>양방향</b> 매핑 · 같은 화면을 만드는 데 SQL 이 몇 번 나가는지 비교 · Spring Boot 3.5 + React
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {strategyError && (
          <div className="alert alert-error text-sm">
            <span>
              백엔드에 연결하지 못했습니다 ({strategyError}).{' '}
              <code className="font-mono">mvnw spring-boot:run</code> 으로 8080 포트를 먼저 띄워주세요.
            </span>
          </div>
        )}

        {/* 상위 탭 */}
        <div className="flex gap-1 border-b border-base-300">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 rounded-t-lg text-sm font-semibold transition-colors border-b-2 -mb-px
                ${t.id === tab
                  ? 'border-primary text-primary bg-base-100'
                  : 'border-transparent text-base-content/50 hover:text-base-content hover:bg-base-100/50'
                }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs font-mono opacity-60">{t.sub}</span>
            </button>
          ))}
        </div>

        {tab === 'posts' && <PostBoard />}
        {tab === 'comments' && <CommentBoard />}
        {tab === 'concept' && <ConceptPanel />}

        <div className="text-center text-xs text-base-content/40 pb-4 space-x-2">
          <code className="badge badge-ghost badge-sm font-mono">GET /api/posts?strategy=</code>
          <code className="badge badge-ghost badge-sm font-mono">GET /api/posts/compare</code>
          <code className="badge badge-ghost badge-sm font-mono">GET /api/comments?strategy=</code>
        </div>
      </div>
    </div>
  );
}
