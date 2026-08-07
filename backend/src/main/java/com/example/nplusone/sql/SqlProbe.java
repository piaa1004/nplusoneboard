package com.example.nplusone.sql;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Supplier;

/**
 * 임의의 작업을 실행하면서 그 동안 나간 SQL·경고·소요 시간을 함께 재는 계측기.
 *
 * <pre>
 * SqlProbe.Result&lt;Page&lt;PostSummary&gt;&gt; probed = sqlProbe.measure(() -&gt; service.list(...));
 * probed.queryCount();  // 실행된 SQL 개수 = N+1 여부의 증거
 * probed.warnings();    // "applying in memory" 같은 Hibernate 경고
 * probed.elapsedMs();   // 소요 시간
 * </pre>
 *
 * <p>람다 안에서 {@code @Transactional} 서비스 메서드를 호출하므로, 트랜잭션 시작~커밋 사이에
 * 발생하는 지연 로딩 쿼리까지 모두 측정 구간에 포함됩니다.
 */
@Component
public class SqlProbe {

    public <T> Result<T> measure(Supplier<T> work) {
        SqlCollector.start();
        WarningCollector.start();
        long startedAt = System.nanoTime();
        try {
            T value = work.get();
            long elapsedMs = (System.nanoTime() - startedAt) / 1_000_000;
            return new Result<>(value, normalize(SqlCollector.stop()), WarningCollector.stop(), elapsedMs);
        } catch (RuntimeException e) {
            // 예외가 나도 스레드 로컬은 반드시 정리한다(스레드 풀에 오염이 남지 않도록).
            SqlCollector.stop();
            WarningCollector.stop();
            throw e;
        }
    }

    /** 여러 줄로 늘어진 SQL 을 한 줄로 정리해 화면에 싣기 좋게 만든다. */
    private List<String> normalize(List<String> queries) {
        return queries.stream()
                .map(sql -> sql.replaceAll("\\s+", " ").trim())
                .toList();
    }

    /** 측정 결과 — 반환값 + 실행된 SQL + Hibernate 경고 + 소요 시간(ms). */
    public record Result<T>(T value, List<String> queries, List<String> warnings, long elapsedMs) {
        public int queryCount() {
            return queries.size();
        }
    }
}
