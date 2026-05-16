package com.zororentals.backend.admin;

public record AdminUserRequest(
        String fullName,
        String email,
        String password,
        String phone,
        String address,
        String nicNumber,
        String drivingLicenseNumber
) {
}
