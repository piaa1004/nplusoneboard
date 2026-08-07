// 백엔드 REST 호출 유틸. Vite 프록시 덕분에 상대경로 /api 로 호출합니다.

function buildQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, v));
    } else {
      sp.append(key, value);
    }
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message || `요청 실패: HTTP ${res.status}`);
  }
  return res.json();
}

async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.message || `요청 실패: HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/** 전략 카탈로그(탭 이름·설명·코드 스니펫). 백엔드 enum 이 그대로 내려온다. */
export function fetchStrategies() {
  return getJson('/api/strategies');
}

/** 게시글 목록 — 전략별 조회 + 실행된 SQL 리포트. */
export function fetchPosts({ strategy, page, size }) {
  return getJson(`/api/posts${buildQuery({ strategy, page, size })}`);
}

/** 다섯 전략을 같은 조건으로 모두 실행해 비교. */
export function comparePosts({ page, size }) {
  return getJson(`/api/posts/compare${buildQuery({ page, size })}`);
}

/** 게시글 상세 + 댓글. fetchJoin=true 면 1쿼리, false 면 2쿼리. */
export function fetchPost(id, fetchJoin) {
  return getJson(`/api/posts/${id}${buildQuery({ fetchJoin })}`);
}

/** 최근 댓글 목록 — N:1 방향 N+1 데모. */
export function fetchComments({ strategy, page, size, sort }) {
  return getJson(`/api/comments${buildQuery({ strategy, page, size, sort })}`);
}

/** 댓글 전략 비교. */
export function compareComments({ page, size, sort }) {
  return getJson(`/api/comments/compare${buildQuery({ page, size, sort })}`);
}

/** 특정 게시글의 댓글 목록. */
export function fetchPostComments(postId) {
  return getJson(`/api/posts/${postId}/comments`);
}

/** 댓글 작성. */
export function createComment(postId, { author, content }) {
  return sendJson(`/api/posts/${postId}/comments`, 'POST', { author, content });
}

/** 댓글 삭제. */
export function deleteComment(postId, commentId) {
  return sendJson(`/api/posts/${postId}/comments/${commentId}`, 'DELETE');
}

/** ISO 문자열 → "YYYY-MM-DD HH:mm" */
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
