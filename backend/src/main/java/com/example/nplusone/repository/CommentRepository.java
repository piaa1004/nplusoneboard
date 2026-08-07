package com.example.nplusone.repository;

import com.example.nplusone.domain.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * 댓글 레포지토리 — 양방향 관계의 <b>N:1 방향</b> N+1 을 비교한다.
 *
 * @see com.example.nplusone.dto.CommentStrategy
 */
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);

    /**
     * ② {@code join fetch c.post} — N:1 은 결과 행이 늘지 않으므로
     * fetch join 과 페이징을 함께 써도 DB 의 LIMIT 이 정확히 동작한다(메모리 페이징 경고 없음).
     *
     * <p>① (프록시를 그대로 두는 전략)은 별도 메서드가 필요 없다.
     * {@link JpaRepository#findAll(Pageable)} 이 정확히 그 동작이기 때문.
     */
    @Query(value = "select c from Comment c join fetch c.post",
            countQuery = "select count(c) from Comment c")
    Page<Comment> findPageFetchJoinPost(Pageable pageable);
}
