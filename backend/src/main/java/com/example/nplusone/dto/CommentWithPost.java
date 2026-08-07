package com.example.nplusone.dto;

import com.example.nplusone.domain.Comment;

import java.time.LocalDateTime;

/**
 * "최근 댓글" 목록용 DTO — 댓글과 함께 <b>어느 게시글의 댓글인지</b>를 보여준다.
 *
 * <p>{@code comment.getPost().getTitle()} 은 LAZY 프록시를 깨우는 호출입니다.
 * 댓글 N건을 조회한 뒤 이 DTO 로 매핑하면 <b>ManyToOne 방향의 N+1</b> 이 발생합니다.
 * 다만 같은 게시글의 댓글은 영속성 컨텍스트(1차 캐시)에서 재사용되므로,
 * 추가 쿼리 수는 "댓글 수" 가 아니라 <b>서로 다른 게시글 수</b> 만큼입니다.
 */
public record CommentWithPost(
        Long id,
        String author,
        String content,
        LocalDateTime createdAt,
        Long postId,
        String postTitle
) {
    public static CommentWithPost from(Comment comment) {
        return new CommentWithPost(
                comment.getId(),
                comment.getAuthor(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getPost().getId(),      // 프록시의 id 는 쿼리 없이 읽힌다.
                comment.getPost().getTitle()    // ← 여기서 프록시가 초기화되며 SELECT 발생
        );
    }
}
