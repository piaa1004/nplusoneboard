package com.example.nplusone.dto;

import java.util.Arrays;
import java.util.List;

/**
 * "최근 댓글" 목록(N:1, {@code Comment.post})을 조회하는 전략.
 *
 * <p>1:N 쪽(게시글 목록)과 달리 <b>ManyToOne 은 fetch join 을 걸어도 결과 행이 늘지 않아</b>
 * 페이징이 DB 에서 정확히 처리됩니다. 양방향 관계의 두 방향이 어떻게 다르게 동작하는지 비교하는 화면입니다.
 */
public enum CommentStrategy {

    NAIVE("naive", "① LAZY 프록시 그대로", Verdict.BAD,
            "N+1 발생 — 단, 추가 쿼리 수는 '댓글 수' 가 아니라 '서로 다른 게시글 수' 입니다",
            "1 + 1 + (서로 다른 게시글 수)",
            List.of(
                    "댓글 목록을 읽은 뒤 comment.getPost().getTitle() 을 호출하면 LAZY 프록시가 깨지며 SELECT 가 나갑니다.",
                    "같은 게시글의 댓글이 여러 개면 1차 캐시(영속성 컨텍스트)에서 재사용되므로 쿼리가 중복되지 않습니다.",
                    "즉 최악의 경우에만 정확히 N번이고, 보통은 그보다 적습니다 — 그래도 목록 크기에 비례해 늘어납니다.",
                    "getPost().getId() 만 쓴다면 프록시가 깨지지 않아 추가 쿼리가 없습니다 (id 는 프록시가 이미 알고 있음)."
            ),
            """
            Page<Comment> comments = commentRepository.findAll(pageable);
            return comments.map(CommentWithPost::from);   // from() 안의 getPost().getTitle() 에서 SELECT"""),

    FETCH_JOIN("fetch-join", "② join fetch (N:1)", Verdict.GOOD,
            "N:1 은 행이 늘지 않으므로 fetch join + 페이징을 함께 써도 안전합니다",
            "1 + 1",
            List.of(
                    "join fetch c.post 로 댓글과 게시글을 한 번에 읽습니다.",
                    "댓글 1건당 게시글 1건이므로 결과 행 수가 그대로 — DB 의 LIMIT/OFFSET 이 정확히 동작합니다.",
                    "1:N 컬렉션 fetch join 과 달리 메모리 페이징 경고(HHH90003004)가 뜨지 않습니다.",
                    "@EntityGraph(attributePaths = \"post\") 로 바꿔 써도 결과는 같습니다."
            ),
            """
            @Query(value = "select c from Comment c join fetch c.post",
                   countQuery = "select count(c) from Comment c")
            Page<Comment> findPageFetchJoinPost(Pageable pageable);""");

    private final String code;
    private final String label;
    private final Verdict verdict;
    private final String headline;
    private final String expected;
    private final List<String> points;
    private final String snippet;

    CommentStrategy(String code, String label, Verdict verdict, String headline,
                    String expected, List<String> points, String snippet) {
        this.code = code;
        this.label = label;
        this.verdict = verdict;
        this.headline = headline;
        this.expected = expected;
        this.points = points;
        this.snippet = snippet;
    }

    public static CommentStrategy of(String code) {
        return Arrays.stream(values())
                .filter(s -> s.code.equalsIgnoreCase(code))
                .findFirst()
                .orElse(NAIVE);
    }

    public static List<StrategyInfo> catalog() {
        return Arrays.stream(values()).map(CommentStrategy::info).toList();
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
