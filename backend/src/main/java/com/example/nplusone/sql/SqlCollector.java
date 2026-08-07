package com.example.nplusone.sql;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 현재 요청(스레드)에서 실행된 SQL 을 모아두는 수집기.
 *
 * <p>Hibernate 의 {@link SqlCaptureInspector} 가 SQL 을 넘겨주면 여기에 쌓이고,
 * {@link SqlProbe} 가 측정 구간의 시작/끝에서 이 수집기를 켜고 끕니다.
 * 스레드 로컬이므로 요청 하나 = 수집 단위이며, 켜지 않은 구간의 SQL 은 수집하지 않습니다.
 */
public final class SqlCollector {

	// ThreadLocal은 OS의 Thread Local Storage가 아님.
	// 단지 JVM이 생성 요청한 특정 스레드만 사용하는 공간(JVM의 힙 공간)
    private static final ThreadLocal<List<String>> HOLDER = new ThreadLocal<>();

    private SqlCollector() {
    }

    static void start() {
        HOLDER.set(new ArrayList<>());
    }

    static List<String> stop() {
        List<String> collected = HOLDER.get();
        HOLDER.remove();
        return collected == null ? Collections.emptyList() : collected;
    }

    /** {@link SqlCaptureInspector} 가 호출. 측정 중이 아니면 무시된다. */
    static void record(String sql) {
        List<String> collected = HOLDER.get();
        if (collected != null) {
            collected.add(sql);
        }
    }
}
