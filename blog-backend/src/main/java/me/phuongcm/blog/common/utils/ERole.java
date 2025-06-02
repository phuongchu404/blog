package me.phuongcm.blog.common.utils;

public enum ERole {
    ROLE_USER("USER"),
    ROLE_ADMIN("ADMIN"),
    ROLE_MODERATOR("MODERATOR");

    private final String value;

    ERole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
