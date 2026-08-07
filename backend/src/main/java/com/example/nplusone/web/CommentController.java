package com.example.nplusone.web;

import com.example.nplusone.dto.CommentRequest;
import com.example.nplusone.dto.CommentResponse;
import com.example.nplusone.dto.CommentStrategy;
import com.example.nplusone.dto.CommentWithPost;
import com.example.nplusone.dto.QueryReport;
import com.example.nplusone.dto.StrategyComparison;
import com.example.nplusone.service.CommentService;
import com.example.nplusone.sql.SqlProbe;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * 댓글 REST 컨트롤러.
 *
 * <pre>
 * GET    /api/comments?strategy=naive&page=0&size=10      최근 댓글 목록 (N:1 방향 N+1 데모)
 * GET    /api/comments/compare                            두 전략 비교
 * GET    /api/posts/{postId}/comments                     특정 게시글 댓글
 * POST   /api/posts/{postId}/comments                     댓글 작성
 * DELETE /api/posts/{postId}/comments/{commentId}         댓글 삭제
 * </pre>
 */
@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final SqlProbe sqlProbe;

    /** 최근 댓글 목록 — 각 댓글이 어느 게시글에 달렸는지(제목)를 함께 보여준다. */
    @GetMapping("/api/comments")
    public QueryReport<List<CommentWithPost>> list(
            @RequestParam(defaultValue = "naive") String strategy,
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        CommentStrategy selected = CommentStrategy.of(strategy);
        SqlProbe.Result<Page<CommentWithPost>> probed =
                sqlProbe.measure(() -> commentService.list(selected, pageable));

        return QueryReport.ofPage(selected.code(), selected.label(), probed);
    }

    /** 두 전략을 같은 조건으로 실행해 비교. */
    @GetMapping("/api/comments/compare")
    public List<StrategyComparison> compare(
            @PageableDefault(size = 10, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        return Arrays.stream(CommentStrategy.values())
                .map(strategy -> {
                    commentService.list(strategy, pageable);   // 예열
                    SqlProbe.Result<?> probed = sqlProbe.measure(() -> commentService.list(strategy, pageable));
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

    @GetMapping("/api/posts/{postId}/comments")
    public List<CommentResponse> listByPost(@PathVariable Long postId) {
        return commentService.listByPost(postId);
    }

    @PostMapping("/api/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse create(@PathVariable Long postId, @RequestBody CommentRequest request) {
        return commentService.create(postId, request);
    }

    @DeleteMapping("/api/posts/{postId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long postId, @PathVariable Long commentId) {
        commentService.delete(postId, commentId);
    }
}
