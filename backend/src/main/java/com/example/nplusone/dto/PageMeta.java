package com.example.nplusone.dto;

import org.springframework.data.domain.Page;

/** 페이지 메타데이터. */
public record PageMeta(int size, int number, long totalElements, int totalPages) {

    public static PageMeta from(Page<?> page) {
        return new PageMeta(page.getSize(), page.getNumber(), page.getTotalElements(), page.getTotalPages());
    }
}
