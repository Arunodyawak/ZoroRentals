package com.zororentals.backend.user;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String address,
        String nicNumber,
        String drivingLicenseNumber,
        String imageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getNicNumber(),
                user.getDrivingLicenseNumber(),
                user.getImagePath(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
