package com.zororentals.backend.user;

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

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{7,15}$");
    private static final Pattern NIC_PATTERN = Pattern.compile("^[A-Za-z0-9]{5,20}$");
    private static final Pattern LICENSE_PATTERN = Pattern.compile("^[A-Za-z0-9\\-]{4,30}$");

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
        if (!StringUtils.hasText(password) || password.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered.");
        }

        User user = new User();
        user.setPasswordHash(passwordEncoder.encode(password));
        applyUserDetails(user, fullName, email, phone, address, nicNumber, drivingLicenseNumber, true);

        if (image != null && !image.isEmpty()) {
            user.setImagePath(saveUserImage(image));
        }

        return userRepository.save(user);
    }

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

        if (StringUtils.hasText(password)) {
            if (password.length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters.");
            }
            user.setPasswordHash(passwordEncoder.encode(password));
        }

        if (image != null && !image.isEmpty()) {
            deleteStoredImage(user.getImagePath());
            user.setImagePath(saveUserImage(image));
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        deleteStoredImage(user.getImagePath());
        userRepository.delete(user);
    }

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
        if (!StringUtils.hasText(fullName) || !StringUtils.hasText(email) || !StringUtils.hasText(phone)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name, email, and phone are required.");
        }

        String cleanFullName = fullName.trim();
        String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
        String cleanPhone = phone.trim();
        String cleanAddress = cleanOptional(address);
        String cleanNicNumber = cleanOptional(nicNumber);
        String cleanDrivingLicenseNumber = cleanOptional(drivingLicenseNumber);

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

        if (cleanNicNumber != null && !NIC_PATTERN.matcher(cleanNicNumber).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "NIC number must be 5 to 20 letters or numbers.");
        }

        if (cleanDrivingLicenseNumber != null && !LICENSE_PATTERN.matcher(cleanDrivingLicenseNumber).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Driving license number must be 4 to 30 letters, numbers, or hyphens.");
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

    private String applyOnceOnlyValue(String existingValue, String newValue, String fieldName) {
        if (StringUtils.hasText(existingValue)) {
            if (StringUtils.hasText(newValue) && !existingValue.equals(newValue)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " cannot be changed after it is saved.");
            }

            return existingValue;
        }

        return newValue;
    }

    private String cleanOptional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String saveUserImage(MultipartFile image) {
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

    private void deleteStoredImage(String imagePath) {
        if (!StringUtils.hasText(imagePath) || !imagePath.startsWith("/uploads/users/")) {
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
