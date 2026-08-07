package com.example.nplusone.dto;

import java.util.List;

/**
 * 전략 설명 메타데이터 — 프론트엔드 탭/설명 카드를 이 정보로 그린다.
 * 설명 문구를 프론트에 하드코딩하지 않고 백엔드가 내려주므로, 전략을 추가하면 화면이 따라옵니다.
 */
public record StrategyInfo(
        String code,
        String label,
        Verdict verdict,
        String headline,
        String expected,
        List<String> points,
        String snippet
) {
}
