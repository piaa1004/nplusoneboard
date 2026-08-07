package com.example.nplusone.dto;

import com.example.nplusone.domain.Comment;

import java.time.LocalDateTime;

/** 댓글 응답 DTO. */
public record CommentResponse(
        Long id,
        String author,
        String content,
        LocalDateTime createdAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getAuthor(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }
}
