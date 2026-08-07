package com.example.nplusone.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 게시글 엔티티.
 *
 * <p><b>이 데모의 핵심</b> — 참고 프로젝트(board-paging-demo)는 {@code Comment → Post} 로만 이어진
 * <b>ManyToOne 단방향</b>이라 게시글을 조회해도 댓글을 건드릴 일이 없어 N+1 이 발생하지 않았습니다.
 * 여기서는 {@code Post → Comment} 방향을 추가해 <b>양방향(1:N ↔ N:1)</b> 으로 만들었고,
 * 그 결과 "게시글 목록 N건을 조회한 뒤 각 게시글의 댓글 컬렉션을 건드리면"
 * 목록 쿼리 1번 + 댓글 쿼리 N번 = <b>N+1 문제</b>가 그대로 재현됩니다.
 *
 * <p>{@link #comments} 와 {@link #batchComments} 는 <b>동일한 comment 테이블</b>을 가리키는
 * 같은 연관관계지만, 배치 페치 설정만 다르게 두 벌 매핑해 두었습니다.
 * 하나의 애플리케이션 안에서 "설정 없음(N+1 발생)" 과 "@BatchSize 적용(IN 절로 한 방)" 을
 * 나란히 비교하기 위한 <b>데모 전용 장치</b>이며, 실무에서는 컬렉션 하나에
 * {@code hibernate.default_batch_fetch_size} 를 전역으로 켜는 것이 일반적입니다.
 */
@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 50)
    private String author;

    @Lob
    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    /**
     * 양방향 연관관계의 <b>주인이 아닌 쪽</b>(mappedBy = "post").
     * 배치 페치 설정이 없으므로, 게시글 N건에 대해 이 컬렉션을 각각 초기화하면 SELECT 가 N번 나갑니다.
     * → {@code /api/posts?strategy=naive} 에서 N+1 을 재현하는 데 쓰입니다.
     */
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @OrderBy("createdAt asc, id asc")
    private List<Comment> comments = new ArrayList<>();
    
    
//    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
//    @OrderBy("createdAt asc, id asc")
//    private List<Attachment> attachments = new ArrayList<>();

    /**
     * 위와 완전히 동일한 연관관계에 {@link BatchSize} 만 얹은 <b>데모 전용 두 번째 매핑</b>(읽기 전용으로만 사용).
     * 초기화되지 않은 컬렉션을 최대 100개까지 모아 {@code where post_id in (?, ?, ...)} 한 방으로 읽습니다.
     * → {@code /api/posts?strategy=batch-size} 에서 사용합니다.
     */
    @BatchSize(size = 100)
    @OneToMany(mappedBy = "post", fetch = FetchType.LAZY)
    @OrderBy("createdAt asc, id asc")
    private List<Comment> batchComments = new ArrayList<>();

    public Post(String title, String author, String content, LocalDateTime createdAt) {
        this.title = title;
        this.author = author;
        this.content = content;
        this.createdAt = createdAt;
    }

    /**
     * 양방향 연관관계 편의 메서드 — 두 방향을 한 번에 맞춘다.
     *
     * <p>양방향에서는 한쪽만 세팅하면 <b>DB 는 맞는데 메모리의 객체 그래프는 어긋나는</b> 상태가 됩니다.
     * FK 를 들고 있는 쪽(Comment.post)만 세팅해도 INSERT 는 정상이지만,
     * 같은 트랜잭션 안에서 {@code post.getComments()} 를 읽으면 방금 추가한 댓글이 빠져 보입니다.
     * 그래서 두 방향을 함께 갱신하는 메서드를 한 곳에 두고 이것만 쓰는 것이 관례입니다.
     */
    public void addComment(Comment comment) {
        this.comments.add(comment);
        comment.assignPost(this);
    }
}
