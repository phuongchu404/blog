package me.phuongcm.blog.common.utils;

import org.springframework.http.HttpStatus;

public enum Error {
    ROLE_NOT_FOUND("Role not found", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND("User not found", HttpStatus.NOT_FOUND),
    USERNAME_ALREADY_EXIST("Username is already exists", HttpStatus.CONFLICT),
    EMAIL_ALREADY_EXIST("Email is already in use", HttpStatus.CONFLICT);

    private String message;

    private HttpStatus status;

    public String getMessage() {
        return message;
    }
    public HttpStatus getStatus() {
        return status;
    }

    Error(String message, HttpStatus status) {
        this.message = message;
        this.status = status;
    }
}
