package com.example.nplusone.config;

import com.example.nplusone.sql.SqlCaptureInspector;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Hibernate 에 SQL 가로채기 훅({@link SqlCaptureInspector})을 심는 설정.
 *
 * <p>{@code hibernate.session_factory.statement_inspector} 프로퍼티에 인스턴스를 직접 넣으면
 * SessionFactory 가 그 인스턴스를 그대로 사용합니다.
 */
@Configuration
public class HibernateInspectorConfig implements HibernatePropertiesCustomizer {

    @Override
    public void customize(Map<String, Object> hibernateProperties) {
        hibernateProperties.put(AvailableSettings.STATEMENT_INSPECTOR, new SqlCaptureInspector());
    }
}
