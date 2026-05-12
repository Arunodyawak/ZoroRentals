package com.zororentals.backend.user;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserValidationTest {

    @Test
    void acceptsValidSriLankanNicNumbers() {
        assertTrue(UserValidation.isValidNic("911234567V"));
        assertTrue(UserValidation.isValidNic("911234567v"));
        assertTrue(UserValidation.isValidNic("199812345678"));
    }

    @Test
    void rejectsInvalidSriLankanNicNumbers() {
        assertFalse(UserValidation.isValidNic(""));
        assertFalse(UserValidation.isValidNic("911234567X"));
        assertFalse(UserValidation.isValidNic("91123 567V"));
        assertFalse(UserValidation.isValidNic("91123456@V"));
        assertFalse(UserValidation.isValidNic("19981234567"));
    }

    @Test
    void acceptsValidDrivingLicenseNumbers() {
        assertTrue(UserValidation.isValidDrivingLicense("B1234567"));
        assertTrue(UserValidation.isValidDrivingLicense("AB12345678"));
    }

    @Test
    void rejectsInvalidDrivingLicenseNumbers() {
        assertFalse(UserValidation.isValidDrivingLicense(""));
        assertFalse(UserValidation.isValidDrivingLicense("A123456"));
        assertFalse(UserValidation.isValidDrivingLicense("AB123456789"));
        assertFalse(UserValidation.isValidDrivingLicense("AB123-456"));
        assertFalse(UserValidation.isValidDrivingLicense("AB 123456"));
    }
}
