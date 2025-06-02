package me.phuongcm.blog.common.utils;

import org.springframework.http.HttpStatus;

public enum Error {
    ROLE_NOT_FOUND("Role not found", HttpStatus.NOT_FOUND);

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
