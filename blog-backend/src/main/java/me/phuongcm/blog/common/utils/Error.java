package me.phuongcm.blog.common.utils;

import org.springframework.http.HttpStatus;

public enum Error {
    ROLE_NOT_FOUND("Role not found", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND("User not found", HttpStatus.NOT_FOUND),
    USERNAME_ALREADY_EXIST("Username is already exists", HttpStatus.CONFLICT),
    EMAIL_ALREADY_EXIST("Email is already in use", HttpStatus.CONFLICT),
    INVALID_CREDENTIALS("Invalid username or password", HttpStatus.UNAUTHORIZED),
    POST_NOT_FOUND("Post not found", HttpStatus.NOT_FOUND),
    CATEGORY_NOT_FOUND("Category not found", HttpStatus.NOT_FOUND),
    TAG_NOT_FOUND("Tag not found", HttpStatus.NOT_FOUND),
    COMMENT_NOT_FOUND("Comment not found", HttpStatus.NOT_FOUND),
    PERMISSION_NOT_FOUND("Permission not found", HttpStatus.NOT_FOUND),
    PERMISSION_ALREADY_EXIST("Permission already exists", HttpStatus.CONFLICT),
    ROLE_ALREADY_EXIST("Role already exists", HttpStatus.CONFLICT),
    CANNOT_DELETE_CATEGORY_WITH_SUBCATEGORIES("Cannot delete category with subcategories", HttpStatus.BAD_REQUEST);

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
