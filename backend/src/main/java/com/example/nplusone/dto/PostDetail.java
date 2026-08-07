package com.example.nplusone.dto;

import com.example.nplusone.domain.Post;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 게시글 상세 DTO (본문 + 댓글 목록).
 *
 * <p>단건 조회에서는 댓글 컬렉션을 한 번만 초기화하므로 쿼리는 2번(게시글 1 + 댓글 1)이고,
 * 이건 N+1 이 아닙니다. N+1 은 "게시글을 N건 조회한 뒤 각각의 컬렉션을 건드릴 때" 생깁니다.
 * 상세 화면은 그 대조군으로 두었습니다.
 */
public record PostDetail(
        Long id,
        String title,
        String author,
        String content,
        LocalDateTime createdAt,
        List<CommentResponse> comments
) {
    public static PostDetail from(Post post) {
        return new PostDetail(
                post.getId(),
                post.getTitle(),
                post.getAuthor(),
                post.getContent(),
                post.getCreatedAt(),
                post.getComments().stream().map(CommentResponse::from).toList()
        );
    }
}
