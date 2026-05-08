package com.group11.compostsystem.dto;

public class AuthResponse {
    private boolean success;
    private String message;
    private UserResponse user;

    public AuthResponse(boolean success, String message, UserResponse user) {
        this.success = success;
        this.message = message;
        this.user = user;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public UserResponse getUser() {
        return user;
    }
}