package me.phuongcm.blog.security.service;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Custom UserDetails triển khai cả UserDetails (JWT) và OAuth2User (Google/...)
 *
 * RBAC: authorities chứa CẢ roles (prefix ROLE_) VÀ permissions (dạng resource:action):
 *   "ROLE_ADMIN", "ROLE_USER", "post:create", "comment:moderate", ...
 *
 * Spring Security mapping:
 *   hasRole("ADMIN")          → tìm "ROLE_ADMIN" trong authorities
 *   hasAuthority("post:create") → tìm "post:create" trong authorities
 */
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomUserDetails implements UserDetails, OAuth2User {

    Long id;
    String username;
    String email;

    @JsonIgnore
    String password;

    /**
     * Gộp cả roles (ROLE_ADMIN, ROLE_USER) và permissions (post:create, comment:moderate)
     * Thay thế field `roles` cũ — Spring Security dùng field này qua getAuthorities().
     */
    Set<String> authorities;

    Map<String, Object> attributes;

    /**
     * Constructor cho JWT login flow (CustomUserDetailsService).
     */
    public CustomUserDetails(Long id, String username, String email, Set<String> authorities, String password) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.authorities = authorities;
        this.password = password;
    }

    /**
     * Constructor cho OAuth2 login flow (CustomOAuth2UserService).
     */
    public CustomUserDetails(Long id, String username, String email, Set<String> authorities,
                             String password, Map<String, Object> attributes) {
        this(id, username, email, authorities, password);
        this.attributes = attributes;
    }

    // ===== UserDetails & OAuth2User interface implementation =====

    @Override
    public String getName() {
        return username;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    /**
     * Trả về tất cả GrantedAuthority: roles + permissions.
     * Spring Security dùng method này để check hasRole() / hasAuthority().
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
