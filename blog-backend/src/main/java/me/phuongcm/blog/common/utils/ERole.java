package me.phuongcm.blog.common.utils;

/**
 * Enum định nghĩa các role trong hệ thống RBAC.
 * Value phải có prefix "ROLE_" để Spring Security's hasRole() hoạt động đúng.
 * hasRole("ADMIN") → tìm kiếm GrantedAuthority "ROLE_ADMIN"
 */
public enum ERole {
    ROLE_USER("ROLE_USER"),
    ROLE_ADMIN("ROLE_ADMIN"),
    ROLE_MODERATOR("ROLE_MODERATOR");

    private final String value;

    ERole(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}
