package me.phuongcm.blog.security.oauth2;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.common.exception.OAuth2AuthenticationProcessingException;
import me.phuongcm.blog.common.exception.ServiceException;
import me.phuongcm.blog.common.utils.AuthProvider;
import me.phuongcm.blog.common.utils.ERole;
import me.phuongcm.blog.common.utils.Error;
import me.phuongcm.blog.common.utils.Status;
import me.phuongcm.blog.entity.Permission;
import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.entity.UserRole;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.repository.PermissionRepository;
import me.phuongcm.blog.repository.RoleRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.repository.UserRoleRepository;
import me.phuongcm.blog.security.oauth2.user.OAuth2UserInfo;
import me.phuongcm.blog.security.oauth2.user.OAuth2UserInfoFactory;
import me.phuongcm.blog.security.service.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    UserRoleRepository userRoleRepository;

    @Autowired
    PermissionRepository permissionRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest oAuth2UserRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(oAuth2UserRequest);
        try {
            return processOAuth2User(oAuth2UserRequest, oAuth2User);
        } catch (Exception e) {
            log.error("OAuth2 authentication failed: {}", e.getMessage());
            throw new InternalAuthenticationServiceException(e.getMessage(), e.getCause());
        }
    }

    private OAuth2User processOAuth2User(OAuth2UserRequest oAuth2UserRequest, OAuth2User oAuth2User) {
        String registrationId = oAuth2UserRequest.getClientRegistration().getRegistrationId();
        OAuth2UserInfo oAuth2UserInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(
                registrationId, oAuth2User.getAttributes());

        if (!StringUtils.hasText(oAuth2UserInfo.getEmail())) {
            throw new OAuth2AuthenticationProcessingException(
                    "Email not found from OAuth2 provider: " + registrationId);
        }

        Long userId = userRepository.findByEmail(oAuth2UserInfo.getEmail())
                .map(existingUser -> {
                    AuthProvider requestedProvider = AuthProvider.valueOf(registrationId);
                    if (!existingUser.getProvider().equals(requestedProvider)) {
                        throw new OAuth2AuthenticationProcessingException(
                                "Signed up with " + existingUser.getProvider() +
                                ". Please use " + existingUser.getProvider() + " to login.");
                    }
                    return updateExistingUser(existingUser, oAuth2UserInfo);
                })
                .orElseGet(() -> registerNewUser(oAuth2UserRequest, oAuth2UserInfo));

        // Load auth: roles + permissions (giống CustomUserDetailsService)
        Set<String> combinedAuthorities = buildAuthorities(userId);

        // Lấy user info để build CustomUserDetails
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));

        return new CustomUserDetails(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                combinedAuthorities,
                user.getPassword(),
                oAuth2User.getAttributes()
        );
    }

    /**
     * Build danh sách authorities = roles + permissions cho RBAC.
     * Nhất quán với CustomUserDetailsService.loadUserByUsername().
     */
    private Set<String> buildAuthorities(Long userId) {
        // Roles (ROLE_ADMIN, ROLE_USER, ...)
        Set<String> roleAuthorities = userRoleRepository.findRoleByUserId(userId)
                .stream().map(role -> role.getName()).collect(Collectors.toSet());

        // Permissions (post:create, comment:moderate, ...)
        Set<String> permissionAuthorities = permissionRepository.findPermissionsByUserId(userId)
                .stream().map(Permission::getName).collect(Collectors.toSet());

        return Stream.concat(roleAuthorities.stream(), permissionAuthorities.stream())
                .collect(Collectors.toSet());
    }

    private Long registerNewUser(OAuth2UserRequest oAuth2UserRequest, OAuth2UserInfo oAuth2UserInfo) {
        User user = new User();
        AuthProvider provider = AuthProvider.valueOf(
                oAuth2UserRequest.getClientRegistration().getRegistrationId());
        user.setProvider(provider);
        user.setProviderId(oAuth2UserInfo.getId());

        String baseUsername = oAuth2UserInfo.getEmail().split("@")[0];
        user.setUsername(generateUniqueUsername(baseUsername));
        user.setFullName(oAuth2UserInfo.getName());
        user.setEmail(oAuth2UserInfo.getEmail());
        user.setImageUrl(oAuth2UserInfo.getImageUrl());
        user.setStatus(Status.ACTIVE.getValue());
        user.setPassword(passwordEncoder.encode(generateRandomPassword(16)));
        user = userRepository.save(user);

        Role role = roleRepository.findByName(ERole.ROLE_USER.getValue())
                .orElseThrow(() -> new ServiceException(Error.ROLE_NOT_FOUND));
        UserRole userRole = new UserRole();
        userRole.setRole(role);
        userRole.setUser(user);
        userRoleRepository.save(userRole);

        log.info("Registered OAuth2 user: {} ({})", user.getUsername(), provider);
        return user.getId();
    }

    private Long updateExistingUser(User user, OAuth2UserInfo oAuth2UserInfo) {
        user.setFullName(oAuth2UserInfo.getName());
        user.setImageUrl(oAuth2UserInfo.getImageUrl());
        userRepository.save(user);
        return user.getId();
    }

    private String generateUniqueUsername(String base) {
        String clean = base.replaceAll("[^a-zA-Z0-9_]", "_");
        String candidate = clean;
        int attempt = 0;
        while (userRepository.existsByUsername(candidate)) {
            candidate = clean + "_" + (++attempt);
        }
        return candidate;
    }

    private String generateRandomPassword(int length) {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return uuid.substring(0, Math.min(length, uuid.length()));
    }
}
