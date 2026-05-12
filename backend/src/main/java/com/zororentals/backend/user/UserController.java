package com.zororentals.backend.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    // POST /api/users - creates a new user from form data.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> createUser(
            @RequestParam String fullName,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String phone,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String nicNumber,
            @RequestParam(required = false) String drivingLicenseNumber,
            @RequestParam(required = false) MultipartFile image
    ) {
        User user = userService.createUser(
                fullName,
                email,
                password,
                phone,
                address,
                nicNumber,
                drivingLicenseNumber,
                image
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    // PUT /api/users/{id} - updates a selected user.
    @PutMapping(path = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestParam String fullName,
            @RequestParam String email,
            @RequestParam(required = false) String password,
            @RequestParam String phone,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String nicNumber,
            @RequestParam(required = false) String drivingLicenseNumber,
            @RequestParam(required = false) MultipartFile image
    ) {
        User user = userService.updateUser(
                id,
                fullName,
                email,
                password,
                phone,
                address,
                nicNumber,
                drivingLicenseNumber,
                image
        );

        return UserResponse.from(user);
    }

    // GET /api/users - returns all users.
    @GetMapping
    public List<UserResponse> getUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }

    // GET /api/users/{id} - returns one user by id.
    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));
    }

    // DELETE /api/users/{id} - deletes one user by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
