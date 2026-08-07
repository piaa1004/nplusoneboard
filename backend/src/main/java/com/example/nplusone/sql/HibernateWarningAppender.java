package com.example.nplusone.sql;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import jakarta.annotation.PostConstruct;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * {@code org.hibernate} 로거에 붙어 WARN 이상 로그를 {@link WarningCollector} 로 흘려보내는 appender.
 *
 * <p>Hibernate 는 경고를 로그로만 알려주기 때문에, 그것을 API 응답에 담으려면 로그를 가로채는 수밖에 없습니다.
 * 로그는 SQL 을 발생시킨 것과 같은 스레드에서 찍히므로 스레드 로컬 수집이 그대로 성립합니다.
 */
@Component
public class HibernateWarningAppender extends AppenderBase<ILoggingEvent> {

    @PostConstruct
    void attach() {
        ch.qos.logback.classic.Logger hibernateLogger =
                (ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.hibernate");
        setContext(hibernateLogger.getLoggerContext());
        setName("hibernate-warning-collector");
        start();
        hibernateLogger.addAppender(this);
    }

    @Override
    protected void append(ILoggingEvent event) {
        if (event.getLevel().isGreaterOrEqual(Level.WARN)) {
            WarningCollector.record(event.getFormattedMessage());
        }
    }
}
