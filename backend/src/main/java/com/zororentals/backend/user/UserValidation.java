package com.zororentals.backend.user;

import org.springframework.util.StringUtils;

import java.util.regex.Pattern;

public final class UserValidation {

    public static final String NIC_ERROR = "NIC must be 9 digits followed by V, or 12 digits.";
    public static final String DRIVING_LICENSE_ERROR = "Driving license must be 8 to 10 letters or numbers.";

    private static final Pattern OLD_NIC_PATTERN = Pattern.compile("^[0-9]{9}[Vv]$");
    private static final Pattern NEW_NIC_PATTERN = Pattern.compile("^[0-9]{12}$");
    private static final Pattern DRIVING_LICENSE_PATTERN = Pattern.compile("^[A-Za-z0-9]{8,10}$");

    private UserValidation() {
    }

    public static String cleanRequired(String value, String fieldName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }

        return value.trim();
    }

    public static boolean isValidNic(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }

        String cleanValue = value.trim();
        return OLD_NIC_PATTERN.matcher(cleanValue).matches() || NEW_NIC_PATTERN.matcher(cleanValue).matches();
    }

    public static boolean isValidDrivingLicense(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }

        return DRIVING_LICENSE_PATTERN.matcher(value.trim()).matches();
    }
}
