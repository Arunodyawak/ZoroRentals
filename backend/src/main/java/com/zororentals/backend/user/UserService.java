package com.zororentals.backend.user;

import com.zororentals.backend.admin.AdminUserRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class UserService {

    // Image formats allowed for user profile photos.
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;

    // Simple validation rules for user input.
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{7,15}$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path uploadRoot;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.upload-dir:uploads}") String uploadDir
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    // Registers a new user, validates the data, hashes the password, and saves the image.
    public User createUser(
            String fullName,
            String email,
            String password,
            String phone,
            String address,
            String nicNumber,
            String drivingLicenseNumber,
            MultipartFile image
    ) {
        validatePassword(password, true);
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }

        User user = new User();
        user.setPasswordHash(passwordEncoder.encode(password));
        applyUserDetails(user, fullName, email, phone, address, nicNumber, drivingLicenseNumber, true);

        if (hasImage(image)) {
            user.setImagePath(saveUserImage(image));
        }

        return userRepository.save(user);
    }

    // Creates a user from the admin dashboard without requiring an image upload.
    public User createUserByAdmin(AdminUserRequest request) {
        validatePassword(request.password(), true);

        String cleanEmail = cleanEmail(request.email());
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }

        User user = new User();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        applyUserDetails(
                user,
                request.fullName(),
                cleanEmail,
                request.phone(),
                request.address(),
                request.nicNumber(),
                request.drivingLicenseNumber(),
                true
        );

        return userRepository.save(user);
    }

    // Updates an existing user. NIC and driving license cannot be changed after saving.
    public User updateUser(
            Long id,
            String fullName,
            String email,
            String password,
            String phone,
            String address,
            String nicNumber,
            String drivingLicenseNumber,
            MultipartFile image
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }

        applyUserDetails(user, fullName, email, phone, address, nicNumber, drivingLicenseNumber, false);

        validatePassword(password, false);
        if (hasValue(password)) {
            user.setPasswordHash(passwordEncoder.encode(password));
        }

        if (hasImage(image)) {
            deleteStoredImage(user.getImagePath());
            user.setImagePath(saveUserImage(image));
        }

        return userRepository.save(user);
    }

    // Updates a user from the admin dashboard. Admins can change NIC and license values.
    public User updateUserByAdmin(Long id, AdminUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        String cleanEmail = cleanEmail(request.email());
        if (userRepository.existsByEmailAndIdNot(cleanEmail, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }

        applyUserDetails(
                user,
                request.fullName(),
                cleanEmail,
                request.phone(),
                request.address(),
                request.nicNumber(),
                request.drivingLicenseNumber(),
                true
        );

        validatePassword(request.password(), false);
        if (hasValue(request.password())) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return userRepository.save(user);
    }

    // Deletes the user record and removes the uploaded profile image.
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        deleteStoredImage(user.getImagePath());
        userRepository.delete(user);
    }

    // Cleans and validates common fields used by both create and update.
    private void applyUserDetails(
            User user,
            String fullName,
            String email,
            String phone,
            String address,
            String nicNumber,
            String drivingLicenseNumber,
            boolean isCreate
    ) {
        if (!hasValue(fullName) || !hasValue(email) || !hasValue(phone)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name, email, and phone are required.");
        }

        String cleanFullName = fullName.trim();
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        String cleanPhone = phone.trim();
        String cleanAddress = cleanOptional(address);
        String cleanNicNumber = cleanRequiredValue(nicNumber, "NIC number");
        String cleanDrivingLicenseNumber = cleanRequiredValue(drivingLicenseNumber, "Driving license number");

        if (cleanFullName.length() < 2 || cleanFullName.length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name must be between 2 and 120 characters.");
        }

        if (!EMAIL_PATTERN.matcher(cleanEmail).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address.");
        }

        if (!PHONE_PATTERN.matcher(cleanPhone).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone must contain 7 to 15 digits and may start with +.");
        }

        if (cleanAddress != null && cleanAddress.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address must be 255 characters or fewer.");
        }

        if (!UserValidation.isValidNic(cleanNicNumber)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, UserValidation.NIC_ERROR);
        }

        if (!UserValidation.isValidDrivingLicense(cleanDrivingLicenseNumber)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, UserValidation.DRIVING_LICENSE_ERROR);
        }

        if (!isCreate) {
            cleanNicNumber = applyOnceOnlyValue(user.getNicNumber(), cleanNicNumber, "NIC number");
            cleanDrivingLicenseNumber = applyOnceOnlyValue(
                    user.getDrivingLicenseNumber(),
                    cleanDrivingLicenseNumber,
                    "Driving license number"
            );
        }

        user.setFullName(cleanFullName);
        user.setEmail(cleanEmail);
        user.setPhone(cleanPhone);
        user.setAddress(cleanAddress);
        user.setNicNumber(cleanNicNumber);
        user.setDrivingLicenseNumber(cleanDrivingLicenseNumber);
    }

    // Used for fields that should be saved once and not changed later.
    private String applyOnceOnlyValue(String existingValue, String newValue, String fieldName) {
        if (hasValue(existingValue)) {
            if (hasValue(newValue) && !existingValue.equals(newValue)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " cannot be changed after it is saved.");
            }

            return existingValue;
        }

        return newValue;
    }

    // Password is required for create, optional for update.
    private void validatePassword(String password, boolean required) {
        if (!required && !hasValue(password)) {
            return;
        }

        if (!hasValue(password) || password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.");
        }
    }

    private String cleanOptional(String value) {
        return hasValue(value) ? value.trim() : null;
    }

    private String cleanEmail(String email) {
        return hasValue(email) ? email.trim().toLowerCase(Locale.ROOT) : email;
    }

    private String cleanRequiredValue(String value, String fieldName) {
        try {
            return UserValidation.cleanRequired(value, fieldName);
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    private boolean hasValue(String value) {
        return StringUtils.hasText(value);
    }

    private boolean hasImage(MultipartFile image) {
        return image != null && !image.isEmpty();
    }

    // Saves the uploaded image with a random file name to avoid duplicate names.
    private String saveUserImage(MultipartFile image) {
        if (image.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image must be 10 MB or smaller.");
        }

        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPG, PNG, and WEBP images are allowed.");
        }

        String extension = StringUtils.getFilenameExtension(image.getOriginalFilename());
        String safeExtension = extension == null ? "jpg" : extension.toLowerCase(Locale.ROOT);
        String fileName = UUID.randomUUID() + "." + safeExtension;
        Path usersDir = uploadRoot.resolve("users").normalize();
        Path target = usersDir.resolve(fileName).normalize();

        if (!target.startsWith(usersDir)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image filename.");
        }

        try {
            Files.createDirectories(usersDir);
            Files.copy(image.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/users/" + fileName;
        } catch (IOException exception) {
            throw new UncheckedIOException("Could not save user image.", exception);
        }
    }

    // Removes the old profile image when a user uploads a new one or deletes the account.
    private void deleteStoredImage(String imagePath) {
        if (!hasValue(imagePath) || !imagePath.startsWith("/uploads/users/")) {
            return;
        }

        Path target = uploadRoot.resolve("users").resolve(Paths.get(imagePath).getFileName()).normalize();

        if (!target.startsWith(uploadRoot.resolve("users").normalize())) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            throw new UncheckedIOException("Could not delete user image.", exception);
        }
    }
}
