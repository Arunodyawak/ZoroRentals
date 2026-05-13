package com.zororentals.backend.review;

public record ReviewRequest(
        Long userId,
        Integer rating,
        String comment
) {
}
