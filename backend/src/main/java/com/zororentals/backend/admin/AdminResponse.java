package com.zororentals.backend.admin;

public record AdminResponse(Long id, String username, String displayName) {
    public static AdminResponse from(Admin admin) {
        return new AdminResponse(admin.getId(), admin.getUsername(), admin.getDisplayName());
    }
}
