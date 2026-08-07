package com.example.nplusone.service;

import com.example.nplusone.domain.Comment;
import com.example.nplusone.domain.Post;
import com.example.nplusone.dto.CommentRequest;
import com.example.nplusone.dto.CommentResponse;
import com.example.nplusone.dto.CommentStrategy;
import com.example.nplusone.dto.CommentWithPost;
import com.example.nplusone.repository.CommentRepository;
import com.example.nplusone.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

/** 댓글 서비스 — 목록(N:1 N+1 데모) + 작성/삭제. */
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    /**
     * 전체 최근 댓글 목록 — 양방향 관계의 <b>N:1 방향</b>을 타고 게시글 제목을 함께 보여준다.
     * 전략에 따라 프록시를 그대로 두거나(N+1), fetch join 으로 한 번에 읽는다.
     */
    @Transactional(readOnly = true)
    public Page<CommentWithPost> list(CommentStrategy strategy, Pageable pageable) {
        Page<Comment> comments = switch (strategy) {
            // ① 기본 findAll — 게시글은 프록시로 남는다. 별도 쿼리를 정의할 필요가 없다.
            case NAIVE -> commentRepository.findAll(pageable);
            case FETCH_JOIN -> commentRepository.findPageFetchJoinPost(pageable);
        };
        // NAIVE 에서는 이 매핑 도중 comment.getPost().getTitle() 이 프록시를 깨우며 SELECT 를 발생시킨다.
        return comments.map(CommentWithPost::from);
    }

    /** 특정 게시글의 댓글 목록. */
    @Transactional(readOnly = true)
    public List<CommentResponse> listByPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(CommentResponse::from)
                .toList();
    }

    @Transactional
    public CommentResponse create(Long postId, CommentRequest request) {
        String author = request.author() == null ? "" : request.author().trim();
        String content = request.content() == null ? "" : request.content().trim();
        if (author.isBlank() || content.isBlank()) {
            throw new IllegalArgumentException("작성자와 내용을 모두 입력해주세요.");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("게시글을 찾을 수 없습니다: " + postId));

        Comment comment = new Comment(post, author, content, LocalDateTime.now());
        // 연관관계 편의 메서드로 양방향을 함께 맞춘다. INSERT 는 주인(Comment.post)이 담당하므로
        // 컬렉션에 담는 것은 메모리상의 객체 그래프를 어긋나지 않게 유지하기 위한 것이다.
        post.addComment(comment);
        return CommentResponse.from(commentRepository.save(comment));
    }

    @Transactional
    public void delete(Long postId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new NoSuchElementException("댓글을 찾을 수 없습니다: " + commentId));
        // getPost() 는 프록시지만 getId() 만 읽으므로 초기화되지 않는다(추가 쿼리 없음).
        if (!comment.getPost().getId().equals(postId)) {
            throw new IllegalArgumentException("해당 게시글의 댓글이 아닙니다.");
        }
        // 컬렉션에서도 빼주려면 post.getComments() 를 초기화해야 해서 쿼리가 한 번 더 나간다.
        // 이 트랜잭션에서는 컬렉션을 읽지 않고 곧바로 끝나므로 주인 쪽만 지운다.
        commentRepository.delete(comment);
    }
}
