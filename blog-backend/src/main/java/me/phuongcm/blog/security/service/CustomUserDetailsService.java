package me.phuongcm.blog.security.service;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import me.phuongcm.blog.entity.Permission;
import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.repository.PermissionRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.repository.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserRoleRepository userRoleRepository;

    @Autowired
    PermissionRepository permissionRepository;

    /**
     * Load user từ DB và build CustomUserDetails với đầy đủ authorities cho RBAC:
     * - Roles: "ROLE_ADMIN", "ROLE_USER", ... (prefix ROLE_ để hasRole() hoạt động)
     * - Permissions: "post:create", "comment:moderate", ... (resource:action)
     *
     * getAuthorities() sẽ trả về tập hợp của cả hai.
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        // 1. Load role names (e.g., "ROLE_ADMIN", "ROLE_USER")
        Set<Role> roles = userRoleRepository.findRoleByUsername(username);
        Set<String> roleAuthorities = roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        // 2. Load permission names (e.g., "post:create", "comment:moderate")
        Set<Permission> permissions = permissionRepository.findPermissionsByUsername(username);
        Set<String> permissionAuthorities = permissions.stream()
                .map(Permission::getTag)
                .collect(Collectors.toSet());

        // 3. Gộp roles + permissions thành một Set<String> authorities
        Set<String> combinedAuthorities = Stream.concat(
                roleAuthorities.stream(),
                permissionAuthorities.stream()
        ).collect(Collectors.toSet());

        return new CustomUserDetails(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                combinedAuthorities,
                user.getPassword()
        );
    }
}
