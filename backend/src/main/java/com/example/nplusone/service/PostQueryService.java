package com.example.nplusone.service;

import com.example.nplusone.domain.Post;
import com.example.nplusone.dto.PostDetail;
import com.example.nplusone.dto.PostStrategy;
import com.example.nplusone.dto.PostSummary;
import com.example.nplusone.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.function.Function;

/**
 * 게시글 조회 서비스 — 전략별로 <b>같은 결과</b>를 만들되 SQL 이 어떻게 달라지는지 보여준다.
 *
 * <p>모든 메서드는 읽기 트랜잭션 안에서 엔티티를 DTO 로 완전히 변환해 반환합니다.
 * ({@code open-in-view: false} 라 컨트롤러에서는 지연 로딩이 불가능합니다 —
 * 지연 로딩 쿼리가 트랜잭션 경계 안에서만 발생해야 계측이 정확해지기도 합니다.)
 */
@Service
@RequiredArgsConstructor
public class PostQueryService {

    private final PostRepository postRepository;

    /**
     * 전략에 따라 게시글 목록을 조회한다. 반환 타입과 내용은 전략과 무관하게 동일하다.
     *
     * <p>Hibernate 로그 대신 {@link com.example.nplusone.sql.SqlProbe} 가 이 메서드 실행 동안의
     * SQL 을 세므로, 전략 간 차이가 숫자로 드러난다.
     */
    @Transactional(readOnly = true)
    public Page<PostSummary> list(PostStrategy strategy, Pageable pageable) {
        return switch (strategy) {

            // ① 게시글만 읽고, DTO 매핑 중 comments 컬렉션을 건드려 게시글마다 SELECT 를 유발 → N+1
            case NAIVE -> postRepository.findAll(pageable)
                    .map(PostSummary::from);

            // ② left join fetch — 컬렉션이 이미 채워져 있어 추가 쿼리가 없다. 대신 페이징이 메모리에서 처리된다.
            case FETCH_JOIN -> postRepository.findPageFetchJoin(pageable)
                    .map(PostSummary::from);

            // ③ @EntityGraph — JPQL 은 ①과 같고 fetch 계획만 다르다. 결국 ②와 같은 SQL 이 만들어진다.
            case ENTITY_GRAPH -> postRepository.findPageEntityGraph(pageable)
                    .map(PostSummary::from);

            // ④ ①과 쿼리가 한 글자도 다르지 않다(findAll 그대로). @BatchSize 가 걸린 컬렉션을 만진다는
            //    차이뿐인데 댓글이 IN 절 한 번으로 로딩된다 — 바뀐 것은 쿼리가 아니라 매핑이다.
            case BATCH_SIZE -> postRepository.findAll(pageable)
            // map(Function<? super T, ? extends U> converter)
            // map에게 전달된 아규먼트는 R apply(T t); 바디...
                    .map(PostSummary::fromBatch);

            // ⑤ 애초에 엔티티/컬렉션을 만들지 않고 DB 에서 count 로 집계 → 지연 로딩이 발생할 여지가 없다
            case DTO_PROJECTION -> postRepository.findSummaryPage(pageable);
        };
    }

    /**
     * 상세 조회 — 게시글 1건 + 댓글 전부.
     *
     * @param fetchJoin true 면 fetch join 으로 1번에, false 면 지연 로딩으로 2번(게시글 1 + 댓글 1)에 읽는다.
     *                  <b>둘 다 N+1 이 아니다</b> — 부모가 1건이면 컬렉션 초기화도 1번뿐이기 때문.
     *                  참고 프로젝트가 단방향이라 N+1 이 없었던 것과는 다른 이유이며,
     *                  N+1 은 부모를 <b>여러 건</b> 조회할 때 비로소 나타난다.
     */
    @Transactional(readOnly = true)
    public PostDetail detail(Long id, boolean fetchJoin) {
        Post post = (fetchJoin ? postRepository.findByIdWithComments(id) : postRepository.findById(id))
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다: " + id));
        return PostDetail.from(post);
    }
}
