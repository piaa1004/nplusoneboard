package com.example.nplusone.dto;

/** 전략에 대한 평가 — 프론트엔드에서 배지 색으로 표시한다. */
public enum Verdict {
    /** 문제를 그대로 드러내는 잘못된 방식. */
    BAD,
    /** 쿼리 수는 줄지만 다른 부작용이 있어 조건부로만 써야 하는 방식. */
    CAUTION,
    /** 페이징까지 안전한 권장 방식. */
    GOOD
}
