package com.example.nplusone.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 게시글 댓글 엔티티 — 양방향 연관관계의 <b>주인</b>(외래키 post_id 를 들고 있는 쪽).
 *
 * <p>{@code fetch = LAZY} 이므로 {@code comment.getPost().getTitle()} 처럼 프록시를 건드리는 순간
 * SELECT 가 한 번 나갑니다. 댓글 N건을 조회한 뒤 각 댓글의 게시글 제목을 읽으면
 * <b>ManyToOne 쪽 N+1</b> 이 발생하며, {@code /api/comments?strategy=naive} 에서 이를 확인할 수 있습니다.
 */
@Entity
@Table(name = "comment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false, length = 50)
    private String author;

    @Column(nullable = false, length = 1000)
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Comment(Post post, String author, String content, LocalDateTime createdAt) {
        this.post = post;
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
    }

    /** 연관관계 편의 메서드에서만 호출 — {@link Post#addComment(Comment)} 참고. */
    void assignPost(Post post) {
        this.post = post;
    }
}
