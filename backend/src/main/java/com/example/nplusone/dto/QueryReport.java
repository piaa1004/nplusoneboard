package com.example.nplusone.dto;

import com.example.nplusone.sql.SqlProbe;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 조회 결과 + <b>그 결과를 만들기 위해 실제로 실행된 SQL</b> 을 함께 담는 응답 봉투.
 *
 * <p>N+1 은 "로그를 봐야만 보이는" 문제라 화면만 봐서는 알 수 없습니다.
 * 이 데모는 실행된 쿼리 개수·SQL 본문·Hibernate 경고를 응답에 실어 내려,
 * 프론트엔드에서 바로 눈으로 확인하게 합니다.
 *
 * <pre>
 * {
 *   "strategy": "naive",
 *   "queryCount": 12,          ← 목록 1 + count 1 + 게시글 10건의 댓글 10
 *   "elapsedMs": 38,
 *   "queries":  [ "select p1_0.id, ... from post p1_0 ...", "select ... where c1_0.post_id=?", ... ],
 *   "warnings": [ ],           ← fetch-join 전략에서는 "applying in memory" 경고가 담긴다
 *   "content":  [ ... ],
 *   "page":     { "size": 10, "number": 0, "totalElements": 200, "totalPages": 20 }
 * }
 * </pre>
 */
public record QueryReport<T>(
        String strategy,
        String label,
        int queryCount,
        long elapsedMs,
        List<String> queries,
        List<String> warnings,
        T content,
        PageMeta page
) {

    /** 페이지 결과용 — content 는 리스트로 펴고, 페이지 메타는 따로 싣는다. */
    public static <E> QueryReport<List<E>> ofPage(String strategy, String label, SqlProbe.Result<Page<E>> probed) {
        Page<E> page = probed.value();
        return new QueryReport<>(
                strategy, label,
                probed.queryCount(), probed.elapsedMs(), probed.queries(), probed.warnings(),
                page.getContent(), PageMeta.from(page)
        );
    }

    /** 단건 결과용. */
    public static <T> QueryReport<T> of(String strategy, String label, SqlProbe.Result<T> probed) {
        return new QueryReport<>(
                strategy, label,
                probed.queryCount(), probed.elapsedMs(), probed.queries(), probed.warnings(),
                probed.value(), null
        );
    }
}
