package com.zororentals.backend.admin;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (adminRepository.existsByUsername("admin1")) {
            return;
        }

        Admin admin = new Admin();
        admin.setUsername("admin1");
        admin.setPasswordHash(passwordEncoder.encode("admin123"));
        admin.setDisplayName("Admin 1");

        adminRepository.save(admin);
    }
}
