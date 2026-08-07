package com.example.nplusone.dto;

import java.util.List;

/**
 * 전략 비교표 한 줄 — 같은 조건으로 모든 전략을 실행했을 때의 쿼리 수·시간·경고.
 * 목록 데이터는 어차피 전부 같으므로 싣지 않고, "몇 번의 쿼리로 만들어졌는지" 만 담는다.
 */
public record StrategyComparison(
        String strategy,
        String label,
        Verdict verdict,
        int queryCount,
        long elapsedMs,
        List<String> queries,
        List<String> warnings
) {
}
