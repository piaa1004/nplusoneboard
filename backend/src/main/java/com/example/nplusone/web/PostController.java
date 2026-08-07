package com.example.nplusone.web;

import com.example.nplusone.dto.PostDetail;
import com.example.nplusone.dto.PostStrategy;
import com.example.nplusone.dto.PostSummary;
import com.example.nplusone.dto.QueryReport;
import com.example.nplusone.dto.StrategyComparison;
import com.example.nplusone.service.PostQueryService;
import com.example.nplusone.sql.SqlProbe;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * 게시글 REST 컨트롤러.
 *
 * <pre>
 * GET /api/posts?strategy=naive&page=0&size=10
 *      → 선택한 전략으로 목록 조회 + 실행된 SQL 리포트
 * GET /api/posts/compare?page=0&size=10
 *      → 다섯 전략을 같은 조건으로 모두 실행해 쿼리 수를 비교
 * GET /api/posts/{id}?fetchJoin=false
 *      → 상세 조회(단건은 N+1 이 아님을 보여주는 대조군)
 * </pre>
 *
 * <p>조회 조건 파라미터는 일부러 두지 않았다. 이 데모에서 결과를 바꾸는 변수는
 * <b>전략</b>과 <b>페이지 크기</b> 둘뿐이어야, 쿼리 수 차이가 전략 때문이라고 말할 수 있다.
 */
@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostQueryService postQueryService;
    private final SqlProbe sqlProbe;

    /** 선택한 전략 하나로 목록을 조회하고, 그 동안 실행된 SQL 을 함께 돌려준다. */
    @GetMapping
    public QueryReport<List<PostSummary>> list(
            @RequestParam(defaultValue = "naive") String strategy,
            @PageableDefault(size = 10, sort = {"createdAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable) {

        PostStrategy selected = PostStrategy.of(strategy);
        SqlProbe.Result<Page<PostSummary>> probed =
                sqlProbe.measure(() -> postQueryService.list(selected, pageable));

        return QueryReport.ofPage(selected.code(), selected.label(), probed);
    }

    /**
     * 다섯 전략을 <b>같은 조건</b>으로 순서대로 실행해 쿼리 수와 소요 시간을 비교한다.
     *
     * <p>측정 전에 한 번씩 예열(warm-up) 실행을 넣는다 — 첫 호출에는 커넥션 확보·JIT·MySQL 버퍼풀 적재 같은
     * 일회성 비용이 섞여 들어가 시간 비교가 왜곡되기 때문. (쿼리 <b>개수</b>는 예열과 무관하게 항상 동일하다.)
     */
    @GetMapping("/compare")
    public List<StrategyComparison> compare(
            @PageableDefault(size = 10, sort = {"createdAt", "id"}, direction = Sort.Direction.DESC) Pageable pageable) {

        return Arrays.stream(PostStrategy.values())
                .map(strategy -> {
                    postQueryService.list(strategy, pageable);   // 예열 (계측 대상 아님)
                    SqlProbe.Result<?> probed = sqlProbe.measure(() -> postQueryService.list(strategy, pageable));
                    return new StrategyComparison(
                            strategy.code(),
                            strategy.label(),
                            strategy.info().verdict(),
                            probed.queryCount(),
                            probed.elapsedMs(),
                            probed.queries(),
                            probed.warnings());
                })
                .toList();
    }

    /**
     * 상세 조회. {@code fetchJoin=true} 면 1쿼리, 기본(지연 로딩)이면 2쿼리다.
     * 부모가 1건이므로 어느 쪽도 N+1 이 아니다 — 목록 화면과 대조해 보기 위한 엔드포인트.
     */
    @GetMapping("/{id}")
    public QueryReport<PostDetail> detail(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean fetchJoin) {

        SqlProbe.Result<PostDetail> probed = sqlProbe.measure(() -> postQueryService.detail(id, fetchJoin));
        String strategy = fetchJoin ? "fetch-join" : "lazy";
        String label = fetchJoin ? "단건 + join fetch (1쿼리)" : "단건 + 지연 로딩 (2쿼리)";
        return QueryReport.of(strategy, label, probed);
    }
}
