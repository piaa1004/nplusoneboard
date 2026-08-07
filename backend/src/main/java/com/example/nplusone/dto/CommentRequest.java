package com.example.nplusone.dto;

/** 댓글 작성 요청. */
public record CommentRequest(String author, String content) {
}
