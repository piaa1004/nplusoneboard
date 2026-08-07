const UNIDIRECTIONAL = `// 참고 프로젝트(board-paging-demo) — ManyToOne 단방향
@Entity
public class Post {
    @Id @GeneratedValue
    private Long id;
    private String title;
    // 댓글로 가는 길이 없다 → 게시글에서 댓글을 건드릴 방법 자체가 없음
}

@Entity
public class Comment {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;          // Comment → Post 한 방향뿐
}`;

const BIDIRECTIONAL = `// 이 프로젝트 — 양방향(1:N ↔ N:1)
@Entity
public class Post {
    @Id @GeneratedValue
    private Long id;
    private String title;

    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();   // ← 추가된 방향

    public void addComment(Comment c) {   // 연관관계 편의 메서드
        comments.add(c);
        c.assignPost(this);
    }
}

@Entity
public class Comment {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;          // 연관관계의 주인(FK 보유)
}`;

function CodeCard({ title, subtitle, tone, code }) {
  const border = tone === 'bad' ? 'border-error/40' : 'border-base-300';
  const head = tone === 'bad' ? 'bg-error/5' : 'bg-success/5';
  return (
    <div className={`rounded-xl border overflow-hidden ${border}`}>
      <div className={`px-4 py-3 ${head}`}>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs text-base-content/55 mt-0.5">{subtitle}</p>
      </div>
      <pre className="bg-neutral text-neutral-content p-4 text-xs overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

/** 개념 탭 — 이 데모가 왜 필요했는지(단방향 → 양방향)와 N+1 의 정의를 정리한다. */
export default function ConceptPanel() {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-300">
      <div className="card-body p-6 space-y-6">

        <section>
          <h2 className="font-extrabold text-lg mb-1">단방향에서는 N+1 이 생기지 않았습니다</h2>
          <p className="text-sm text-base-content/70 leading-relaxed">
            참고 프로젝트는 <code className="badge badge-ghost badge-sm font-mono">Comment → Post</code> 로만 이어진
            ManyToOne <b>단방향</b>이었습니다. 게시글 엔티티에 댓글 컬렉션이 아예 없으니
            <b> 게시글을 조회하면서 댓글을 건드릴 코드를 작성할 수가 없고</b>, 따라서 N+1 도 구조적으로 발생하지 않습니다.
            이 데모는 그 반대 방향(<code className="badge badge-ghost badge-sm font-mono">Post → Comment</code>)을 열어
            <b> 양방향</b>으로 만든 뒤, 목록 화면에서 댓글 수를 함께 보여주는 흔한 요구사항을 구현하면서
            N+1 이 어떻게 터지는지 재현합니다.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CodeCard
            title="Before — 단방향 (N+1 없음)"
            subtitle="편하진 않지만 안전하다. 댓글 수가 필요하면 매번 별도 쿼리를 짜야 한다."
            tone="good"
            code={UNIDIRECTIONAL}
          />
          <CodeCard
            title="After — 양방향 (N+1 가능)"
            subtitle="코드는 편해지지만 지연 로딩 폭탄을 직접 관리해야 한다."
            tone="bad"
            code={BIDIRECTIONAL}
          />
        </div>

        <section className="rounded-xl bg-base-200/50 border border-base-300 px-5 py-4">
          <h3 className="font-bold text-sm mb-2">N+1 이 정확히 언제 생기나요?</h3>
          <ul className="space-y-1.5 text-sm text-base-content/70">
            <li className="flex gap-2">
              <span className="text-primary shrink-0">1</span>
              <span><b>부모를 여러 건</b> 조회한다 (게시글 목록 10건 → 쿼리 1번)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">2</span>
              <span>각 부모의 <b>지연 로딩 연관</b>을 건드린다 (<code className="font-mono text-xs">post.getComments().size()</code>)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">3</span>
              <span>부모 하나마다 SELECT 가 한 번씩 추가로 나간다 → <b>1 + N</b></span>
            </li>
          </ul>
          <p className="text-sm text-base-content/60 mt-3 pt-3 border-t border-base-300">
            💡 그래서 <b>단건 상세 조회는 N+1 이 아닙니다</b>. 부모가 1건이면 컬렉션 초기화도 한 번뿐이라
            게시글 1 + 댓글 1 = 2쿼리로 끝납니다. 게시글 상세 화면에서 직접 확인해 보세요.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-sm mb-3">해결 전략 한눈에 보기</h3>
          <div className="overflow-x-auto rounded-xl border border-base-300">
            <table className="table table-sm w-full">
              <thead className="bg-base-200/60 text-xs uppercase text-base-content/60">
                <tr>
                  <th>전략</th>
                  <th>쿼리 수</th>
                  <th>페이징</th>
                  <th>언제 쓰나</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-base-200">
                  <td className="font-medium">지연 로딩 그대로</td>
                  <td className="font-mono text-error">1 + 1 + N</td>
                  <td>정확 ✅</td>
                  <td className="text-base-content/60">쓰면 안 됨 (문제 상황)</td>
                </tr>
                <tr className="border-b border-base-200">
                  <td className="font-medium">join fetch / @EntityGraph</td>
                  <td className="font-mono text-success">1 + 1</td>
                  <td className="text-warning">메모리 ⚠️</td>
                  <td className="text-base-content/60">단건 조회, 또는 페이징이 없는 조회</td>
                </tr>
                <tr className="border-b border-base-200">
                  <td className="font-medium">@BatchSize</td>
                  <td className="font-mono text-success">1 + 1 + 1</td>
                  <td>정확 ✅</td>
                  <td className="text-base-content/60"><b>목록 + 페이징의 기본 해법</b></td>
                </tr>
                <tr>
                  <td className="font-medium">DTO 직접 투영</td>
                  <td className="font-mono text-success">1 + 1</td>
                  <td>정확 ✅</td>
                  <td className="text-base-content/60">조회 전용 화면에서 가장 가벼움</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-base-content/45 mt-2">
            ⚠️ join fetch 의 &ldquo;메모리&rdquo; 는 <b>1:N 컬렉션</b>일 때의 이야기입니다.
            N:1(댓글 → 게시글)은 결과 행이 늘지 않으므로 fetch join + 페이징이 안전합니다 — 최근 댓글 탭에서 확인하세요.
          </p>
        </section>

      </div>
    </div>
  );
}
