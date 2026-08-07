package com.example.nplusone.web;

import com.example.nplusone.dto.CommentStrategy;
import com.example.nplusone.dto.PostStrategy;
import com.example.nplusone.dto.StrategyInfo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 전략 카탈로그 — 탭 이름·설명·코드 스니펫을 백엔드가 내려준다.
 * 프론트엔드에 설명을 하드코딩하지 않으므로, 전략을 추가하면 화면이 자동으로 따라온다.
 */
@RestController
@RequestMapping("/api/strategies")
public class StrategyController {

    @GetMapping
    public Catalog catalog() {
        return new Catalog(PostStrategy.catalog(), CommentStrategy.catalog());
    }

    public record Catalog(List<StrategyInfo> posts, List<StrategyInfo> comments) {
    }
}
