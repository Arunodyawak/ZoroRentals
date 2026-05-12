package com.zororentals.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Spring Data JPA creates the SQL queries from these method names.
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);
}
