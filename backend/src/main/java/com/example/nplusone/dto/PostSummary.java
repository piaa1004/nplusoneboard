package com.example.nplusone.dto;

import com.example.nplusone.domain.Post;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 목록 화면용 게시글 요약 DTO.
 *
 * <p>다섯 전략이 <b>전부 똑같은 이 DTO</b>를 만들어 냅니다. 즉 화면에 보이는 결과는 완전히 동일하고,
 * 달라지는 것은 오직 "그 결과를 만들기 위해 나간 SQL 개수" 뿐입니다.
 *
 * <p>필드 중 {@code commentCount} 만이 연관 컬렉션을 필요로 합니다. 나머지는 post 테이블 한 번이면
 * 끝나는 값들이고, <b>이 한 필드 때문에 N+1 이 생깁니다.</b> 그래서 화면에 안 쓰는 값은 두지 않았습니다 —
 * 필드가 늘어나면 어느 필드가 문제의 원인인지 흐려지기 때문입니다.
 */
public record PostSummary(
        Long id,
        String title,
        String author,
        LocalDateTime createdAt,
        long commentCount
) {

    /**
     * 엔티티 → DTO. {@code post.getComments().size()} 가 <b>지연 로딩 트리거</b>입니다.
     * 컬렉션이 아직 초기화되지 않았다면 이 한 줄이 SELECT 를 한 번 발생시킵니다.
     */
    public static PostSummary from(Post post) {
        return of(post, post.getComments());
    }

    /** {@code @BatchSize} 가 걸린 두 번째 매핑을 사용하는 버전. 호출하는 코드는 위와 똑같습니다. */
    // Post post 는 엔티티 클래스 인스턴스이기 때문에 다른 계층에 전달하기가 그렇다...
    // DTO[PostSummary]을 만들어서 다른 계층에 전달한다.
    public static PostSummary fromBatch(Post post) {
        return of(post, post.getBatchComments()); // @BatchSize 어노테이션이 적용된 연관 관계 필드를 가져오기 위해
    }

    private static PostSummary of(Post post, List<?> comments) {
        return new PostSummary(
                post.getId(),
                post.getTitle(),
                post.getAuthor(),
                post.getCreatedAt(),
                comments.size()
        );
    }
}
