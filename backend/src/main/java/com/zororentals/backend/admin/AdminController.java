package com.zororentals.backend.admin;

import com.zororentals.backend.user.User;
import com.zororentals.backend.user.UserRepository;
import com.zororentals.backend.user.UserResponse;
import com.zororentals.backend.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminRepository adminRepository;
    private final AdminService adminService;
    private final UserRepository userRepository;
    private final UserService userService;

    public AdminController(
            AdminRepository adminRepository,
            AdminService adminService,
            UserRepository userRepository,
            UserService userService
    ) {
        this.adminRepository = adminRepository;
        this.adminService = adminService;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @GetMapping("/admins")
    public List<AdminResponse> getAdmins() {
        return adminRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Admin::getId))
                .map(AdminResponse::from)
                .toList();
    }

    @PostMapping("/admins")
    public ResponseEntity<AdminResponse> createAdmin(@RequestBody AdminRequest request) {
        Admin admin = adminService.createAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(AdminResponse.from(admin));
    }

    @PutMapping("/admins/{id}")
    public AdminResponse updateAdmin(@PathVariable Long id, @RequestBody AdminRequest request) {
        return AdminResponse.from(adminService.updateAdmin(id, request));
    }

    @DeleteMapping("/admins/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public List<UserResponse> getUsers() {
        return userRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(User::getId))
                .map(UserResponse::from)
                .toList();
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@RequestBody AdminUserRequest request) {
        User user = userService.createUserByAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    @PutMapping("/users/{id}")
    public UserResponse updateUser(@PathVariable Long id, @RequestBody AdminUserRequest request) {
        return UserResponse.from(userService.updateUserByAdmin(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
