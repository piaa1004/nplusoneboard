package com.example.nplusone.sql;

import org.hibernate.resource.jdbc.spi.StatementInspector;

/**
 * Hibernate 가 JDBC 로 SQL 을 내보내기 직전에 가로채는 훅.
 *
 * <p>로그를 눈으로 세는 대신, 실행된 SQL 을 프로그램이 직접 세어 응답 JSON 으로 내려주기 위한 장치입니다.
 * "N+1 이 몇 번의 쿼리로 나타나는지" 를 프론트엔드 화면에서 숫자로 확인할 수 있게 해줍니다.
 */
public class SqlCaptureInspector implements StatementInspector {

    @Override
    public String inspect(String sql) {
        SqlCollector.record(sql);
        return sql;   // SQL 자체는 손대지 않고 그대로 통과시킨다.
    }
}
