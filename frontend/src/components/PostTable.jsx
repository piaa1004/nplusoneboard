import { useNavigate } from 'react-router-dom';
import { formatDate } from '../api.js';

/**
 * 게시글 목록 테이블.
 *
 * <b>댓글 열</b>이 이 데모의 방아쇠입니다. 이 값 하나를 채우려면 게시글마다 댓글 컬렉션을 건드려야 하고,
 * 어떤 전략으로 가져왔느냐에 따라 SQL 이 12번이 되기도, 2번이 되기도 합니다.
 * 정작 이 표는 어떤 전략을 골라도 완전히 동일합니다 — 그게 이 화면이 말하려는 전부입니다.
 *
 * 나머지 열은 post 테이블 한 번이면 끝나는 값들이라, 어느 열이 문제의 원인인지 흐리지 않도록
 * 꼭 필요한 것만 남겼습니다.
 */
export default function PostTable({ posts }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-xl border border-base-300">
      <table className="table table-sm w-full">
        <thead className="bg-base-200/60 text-xs uppercase tracking-wide text-base-content/60">
          <tr>
            <th className="col-id py-3">NO</th>
            <th>제목</th>
            <th className="col-author">작성자</th>
            <th className="col-comment">댓글</th>
            <th className="col-date">작성일</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-16 text-base-content/30">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">📭</span>
                  <span className="text-sm">게시글이 없습니다.</span>
                </div>
              </td>
            </tr>
          ) : (
            posts.map((p) => (
              <tr
                key={p.id}
                className="clickable-row hover:bg-primary/5 transition-colors border-b border-base-200 last:border-0"
                onClick={() => navigate(`/posts/${p.id}`)}
              >
                <td className="col-id text-xs text-base-content/30 font-mono">{p.id}</td>
                <td className="post-title-link">{p.title}</td>
                <td className="col-author text-sm text-base-content/70">{p.author}</td>
                <td className="col-comment">
                  {p.commentCount > 0 ? (
                    <span className="badge badge-primary badge-outline badge-sm font-mono">
                      💬 {p.commentCount}
                    </span>
                  ) : (
                    <span className="text-xs text-base-content/20 font-mono">—</span>
                  )}
                </td>
                <td className="col-date text-xs text-base-content/40 font-mono">{formatDate(p.createdAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
