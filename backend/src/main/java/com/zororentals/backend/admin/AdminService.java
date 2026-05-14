package com.zororentals.backend.admin;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Admin createAdmin(AdminRequest request) {
        String username = cleanUsername(request.username());
        String displayName = cleanDisplayName(request.displayName(), username);

        if (!StringUtils.hasText(request.password()) || request.password().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.");
        }

        if (adminRepository.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Admin username is already used.");
        }

        Admin admin = new Admin();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(request.password()));
        admin.setDisplayName(displayName);

        return adminRepository.save(admin);
    }

    public Admin updateAdmin(Long id, AdminRequest request) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found."));

        String username = cleanUsername(request.username());
        String displayName = cleanDisplayName(request.displayName(), username);

        if (adminRepository.existsByUsernameAndIdNot(username, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Admin username is already used.");
        }

        admin.setUsername(username);
        admin.setDisplayName(displayName);

        if (StringUtils.hasText(request.password())) {
            if (request.password().length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.");
            }

            admin.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return adminRepository.save(admin);
    }

    public void deleteAdmin(Long id) {
        Admin admin = adminRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found."));

        if (adminRepository.count() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one admin account is required.");
        }

        adminRepository.delete(admin);
    }

    private String cleanUsername(String username) {
        if (!StringUtils.hasText(username)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required.");
        }

        String cleanUsername = username.trim().toLowerCase(Locale.ROOT);

        if (cleanUsername.length() < 3 || cleanUsername.length() > 80) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username must be between 3 and 80 characters.");
        }

        if (cleanUsername.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin username cannot contain @.");
        }

        return cleanUsername;
    }

    private String cleanDisplayName(String displayName, String username) {
        String cleanDisplayName = StringUtils.hasText(displayName) ? displayName.trim() : username;

        if (cleanDisplayName.length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name must be 120 characters or fewer.");
        }

        return cleanDisplayName;
    }
}
