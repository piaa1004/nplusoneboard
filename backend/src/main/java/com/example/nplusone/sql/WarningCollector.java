package com.example.nplusone.sql;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 측정 구간 동안 Hibernate 가 남긴 <b>경고 로그</b>를 모아두는 수집기.
 *
 * <p>가장 중요한 손님은 {@code HHH90003004: firstResult/maxResults specified with collection fetch;
 * applying in memory} 입니다. 이 경고는 "DB 가 아니라 애플리케이션 메모리에서 페이징했다" 는 뜻이라,
 * 쿼리 수만 보면 fetch join 이 가장 좋아 보이는 착시를 깨주는 결정적인 단서입니다.
 * 로그 파일을 열어야만 보이던 것을 응답 JSON 에 실어 화면에서 바로 보이게 합니다.
 */
public final class WarningCollector {

    private static final ThreadLocal<List<String>> HOLDER = new ThreadLocal<>();

    private WarningCollector() {
    }

    static void start() {
        HOLDER.set(new ArrayList<>());
    }

    /** 같은 경고가 여러 번 찍히는 경우가 있어 중복은 제거하고 순서는 유지한다. */
    static List<String> stop() {
        List<String> collected = HOLDER.get();
        HOLDER.remove();
        if (collected == null) {
            return Collections.emptyList();
        }
        Set<String> unique = new LinkedHashSet<>(collected);
        return List.copyOf(unique);
    }

    /** {@link HibernateWarningAppender} 가 호출. 측정 중이 아니면 무시된다. */
    static void record(String message) {
        List<String> collected = HOLDER.get();
        if (collected != null) {
            collected.add(message);
        }
    }
}
