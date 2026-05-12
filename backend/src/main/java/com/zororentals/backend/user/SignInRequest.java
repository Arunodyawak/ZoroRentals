package com.zororentals.backend.user;

// JSON body used by the sign-in endpoint.
public record SignInRequest(String email, String password) {
}
