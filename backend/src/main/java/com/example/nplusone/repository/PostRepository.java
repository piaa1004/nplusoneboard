package com.example.nplusone.repository;

import com.example.nplusone.domain.Post;
import com.example.nplusone.dto.PostSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * 게시글 레포지토리 — 같은 결과를 만드는 <b>다섯 가지 조회 방식</b>을 나란히 정의해 비교한다.
 *
 * <p>조회 <b>조건</b>은 없다. 전부 "전체 목록을 페이징" 이며, 갈리는 것은 오직
 * <b>연관 컬렉션을 언제·어떻게 읽어오는가</b> 뿐이다. 그래서 메서드 이름도 조건이 아니라
 * fetch 전략으로 구분한다.
 *
 * <p>①(지연 로딩)과 ④(@BatchSize)는 <b>메서드조차 필요 없다</b> —
 * {@link JpaRepository#findAll(Pageable)} 이 곧 그 쿼리이고, 둘의 차이는 쿼리가 아니라
 * 서비스에서 어느 컬렉션을 만지느냐(= 엔티티 매핑)에서 갈리기 때문이다.
 *
 * @see com.example.nplusone.dto.PostStrategy
 */
public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * ② JPQL join fetch — 게시글과 댓글을 한 방에.
     *
     * <p>1:N 조인이라 결과 행이 댓글 수만큼 늘어나므로 Hibernate 는 DB LIMIT 을 쓰지 못하고
     * <b>조건에 맞는 행을 전부 읽어 메모리에서 페이징</b>한다(HHH90003004 경고).
     * 쿼리 수는 줄지만 대용량에서는 위험하다는 점을 보여주기 위한 케이스.
     *
     * <p>{@code distinct} 는 부모 엔티티 중복 제거용 표기이며, Hibernate 6 는 컬렉션 fetch join 에서
     * 이 키워드를 실제 SQL 로 내보내지 않는다(중복 제거를 이미 자동으로 하기 때문).
     */
    @Query(value = "select distinct p from Post p left join fetch p.comments",
            countQuery = "select count(p) from Post p")
    Page<Post> findPageFetchJoin(Pageable pageable);

    /**
     * ③ {@code @EntityGraph} — JPQL 은 그냥 전체 조회이고, fetch 계획만 애노테이션으로 얹는다.
     * 그 결과 만들어지는 SQL 은 ②의 left join fetch 와 사실상 같으며, 메모리 페이징 문제도 동일하게 발생한다.
     * "쿼리를 고치지 않고 fetch 전략만 바꿔도 결과가 같아진다" 는 점이 이 방식의 요지다.
     */
    @EntityGraph(attributePaths = "comments")  
    @Query(value = "select p from Post p", // left outer join comments
            countQuery = "select count(p) from Post p")
    Page<Post> findPageEntityGraph(Pageable pageable);
    
//    @EntityGraph(attributePaths = "attachment")  
//    @Query(value = "select p from Post p", // left outer join attachment
//            countQuery = "select count(p) from Post p")
//    Page<Post> findPageEntityGraph2(Pageable pageable);

    /**
     * ⑤ DTO 직접 투영 — 댓글 <b>개수</b>만 필요하므로 컬렉션을 아예 로딩하지 않고 DB 에서 집계한다.
     * 엔티티가 영속화되지 않으므로 지연 로딩이 일어날 여지 자체가 없다.
     */
    @Query(value = "select new com.example.nplusone.dto.PostSummary("
            + "  p.id, p.title, p.author, p.createdAt, count(c.id)) "
            + "from Post p left join p.comments c "
            + "group by p.id, p.title, p.author, p.createdAt",
            countQuery = "select count(p) from Post p")
    Page<PostSummary> findSummaryPage(Pageable pageable);

    /**
     * 상세 화면용 — 단건 + 댓글을 fetch join 으로 한 번에.
     * 단건이라 페이징이 없으므로 컬렉션 fetch join 을 안심하고 쓸 수 있다.
     */
    @Query("select p from Post p left join fetch p.comments where p.id = :id")
    Optional<Post> findByIdWithComments(@Param("id") Long id);
}
