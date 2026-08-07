package com.example.nplusone.dto;

import java.util.Arrays;
import java.util.List;

/**
 * 게시글 목록(1:N, {@code Post.comments})을 조회하는 다섯 가지 전략.
 *
 * <p>다섯 전략 모두 <b>결과 JSON 은 완전히 동일</b>합니다. 차이는 오직 나가는 SQL 개수와 페이징 정확도입니다.
 * {@code page=0&size=10} 기준 예상 쿼리 수를 {@code expected} 에 적어두었습니다.
 */
public enum PostStrategy {

    NAIVE("naive", "① 지연 로딩 그대로", Verdict.BAD,
            "N+1 발생 — 목록 1번 + 카운트 1번 + 게시글마다 댓글 1번",
            "1 + 1 + N",
            List.of(
                    "postRepository.findAll(pageable) 로 게시글 N건을 먼저 읽습니다 — 여기까지는 쿼리 2번(목록 + count)입니다.",
                    "DTO 로 매핑하며 post.getComments().size() 를 호출하는 순간, 게시글마다 댓글 SELECT 가 한 번씩 나갑니다.",
                    "size=10 이면 쿼리 12번, size=50 이면 52번 — 페이지 크기에 비례해 선형으로 늘어납니다.",
                    "단방향(ManyToOne) 이었다면 컬렉션 자체가 없어 이 코드를 쓸 수조차 없었습니다."
            ),
            """
            Page<Post> posts = postRepository.findAll(pageable);
            return posts.map(PostSummary::from);   // from() 안에서 post.getComments().size() → N번 SELECT"""),

    FETCH_JOIN("fetch-join", "② JPQL join fetch", Verdict.CAUTION,
            "쿼리는 2번으로 줄지만, 페이징이 DB 가 아닌 메모리에서 처리됩니다",
            "1 + 1",
            List.of(
                    "left join fetch 로 게시글과 댓글을 한 번에 읽어 컬렉션이 이미 초기화된 상태가 됩니다.",
                    "그러나 1:N 을 조인하면 결과 행이 댓글 수만큼 뻥튀기되어, DB 의 LIMIT 을 그대로 쓸 수 없습니다.",
                    "Hibernate 는 조건에 맞는 행을 전부 읽어와 애플리케이션 메모리에서 페이징합니다 (HHH90003004 경고).",
                    "게시글이 수십만 건이면 OOM 위험 — 페이징과 컬렉션 fetch join 은 함께 쓰지 않는 것이 원칙입니다."
            ),
            """
            @Query(value = "select distinct p from Post p left join fetch p.comments",
                   countQuery = "select count(p) from Post p")
            Page<Post> findPageFetchJoin(Pageable pageable);"""),

    ENTITY_GRAPH("entity-graph", "③ @EntityGraph", Verdict.CAUTION,
            "선언만 바뀔 뿐 동작은 join fetch 와 같습니다 — 메모리 페이징도 그대로",
            "1 + 1",
            List.of(
                    "@EntityGraph(attributePaths = \"comments\") 는 JPQL 을 건드리지 않고 fetch 계획만 바꿉니다.",
                    "①과 JPQL 이 한 글자도 다르지 않은데 애노테이션 한 줄로 결과가 달라지는 것이 요지입니다.",
                    "따라서 1:N 컬렉션 + Pageable 조합이면 메모리 페이징 문제도 똑같이 따라옵니다.",
                    "@EntityGraph 는 ManyToOne / OneToOne 을 함께 읽을 때 가장 안전하게 쓰입니다."
            ),
            """
            @EntityGraph(attributePaths = "comments")     // ← 이 한 줄만 추가
            @Query(value = "select p from Post p",        // ①의 findAll 과 동일한 조회
                   countQuery = "select count(p) from Post p")
            Page<Post> findPageEntityGraph(Pageable pageable);"""),

    BATCH_SIZE("batch-size", "④ @BatchSize (IN 절)", Verdict.GOOD,
            "페이징은 DB 가 정확히 처리하고, 댓글은 IN 절 한 방으로 — 실무 표준 해법",
            "1 + 1 + 1",
            List.of(
                    "게시글은 평소대로 LIMIT/OFFSET 으로 정확히 페이징합니다.",
                    "댓글 컬렉션을 처음 건드릴 때, 아직 초기화되지 않은 나머지 컬렉션까지 최대 size 개를 모아 where post_id in (?, ?, …) 한 번으로 읽습니다.",
                    "쿼리 수가 N 에 비례하지 않고 (게시글 수 / batch size) 에 비례해 사실상 상수로 떨어집니다.",
                    "엔티티마다 붙이는 대신 application.yml 의 hibernate.default_batch_fetch_size 로 전역 적용하는 것이 일반적입니다."
            ),
            """
            // 엔티티에 선언
            @BatchSize(size = 100)
            @OneToMany(mappedBy = "post")
            private List<Comment> comments = new ArrayList<>();

            // 또는 application.yml 에 전역 설정
            spring.jpa.properties.hibernate.default_batch_fetch_size: 100"""),

    DTO_PROJECTION("dto-projection", "⑤ DTO 직접 투영 (group by)", Verdict.GOOD,
            "댓글 수만 필요하다면 컬렉션을 아예 로딩하지 않는 것이 가장 빠릅니다",
            "1 + 1",
            List.of(
                    "JPQL 의 new 연산자로 DTO 를 직접 만들면 엔티티도, 컬렉션도 영속화되지 않습니다.",
                    "left join + group by 로 댓글 개수를 DB 에서 집계하므로 지연 로딩 자체가 일어나지 않습니다.",
                    "화면에 필요한 필드만 읽으므로 본문(MEDIUMTEXT) 같은 큰 컬럼을 실어 나르지 않습니다.",
                    "대신 엔티티가 아니라 값이므로 더티 체킹(변경 감지)이 되지 않습니다 — 조회 전용 화면에 적합합니다."
            ),
            """
            @Query(value = "select new com.example.nplusone.dto.PostSummary("
                         + "  p.id, p.title, p.author, p.createdAt, count(c.id)) "
                         + "from Post p left join p.comments c "
                         + "group by p.id, p.title, p.author, p.createdAt",
                   countQuery = "select count(p) from Post p")
            Page<PostSummary> findSummaryPage(Pageable pageable);""");

    private final String code;
    private final String label;
    private final Verdict verdict;
    private final String headline;
    private final String expected;
    private final List<String> points;
    private final String snippet;

    PostStrategy(String code, String label, Verdict verdict, String headline,
                 String expected, List<String> points, String snippet) {
        this.code = code;
        this.label = label;
        this.verdict = verdict;
        this.headline = headline;
        this.expected = expected;
        this.points = points;
        this.snippet = snippet;
    }

    /** URL 파라미터(kebab-case) → enum. 알 수 없는 값이면 NAIVE. */
    public static PostStrategy of(String code) {
        return Arrays.stream(values())
                .filter(s -> s.code.equalsIgnoreCase(code))
                .findFirst()
                .orElse(NAIVE);
    }

    public static List<StrategyInfo> catalog() {
        return Arrays.stream(values()).map(PostStrategy::info).toList();
    }

    public StrategyInfo info() {
        return new StrategyInfo(code, label, verdict, headline, expected, points, snippet);
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }
}
