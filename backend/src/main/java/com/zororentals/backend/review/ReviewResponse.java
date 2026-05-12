package com.zororentals.backend.review;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long userId,
        String userName,
        String userImageUrl,
        Integer rating,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getFullName(),
                review.getUser().getImagePath(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
