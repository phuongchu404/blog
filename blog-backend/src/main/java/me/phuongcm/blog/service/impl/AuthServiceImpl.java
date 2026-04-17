package me.phuongcm.blog.service.impl;

import java.time.LocalDateTime;

import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.common.exception.ServiceException;
import me.phuongcm.blog.common.utils.AuthProvider;
import me.phuongcm.blog.common.utils.ERole;
import me.phuongcm.blog.common.utils.Error;
import me.phuongcm.blog.common.utils.Status;
import me.phuongcm.blog.dto.ChangePasswordRequestDTO;
import me.phuongcm.blog.dto.LoginRequest;
import me.phuongcm.blog.dto.LoginResponse;
import me.phuongcm.blog.dto.RegisterRequest;
import me.phuongcm.blog.dto.UserDTO;
import me.phuongcm.blog.dto.UserMapper;
import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.entity.UserRole;
import me.phuongcm.blog.repository.PermissionRepository;
import me.phuongcm.blog.repository.RoleRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.repository.UserRoleRepository;
import me.phuongcm.blog.security.SecurityUtil;
import me.phuongcm.blog.security.jwt.JwtUtil;
import me.phuongcm.blog.service.AuthService;
import me.phuongcm.blog.service.MinIOService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import me.phuongcm.blog.entity.RefreshToken;
import me.phuongcm.blog.security.service.RefreshTokenService;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final UserMapper userMapper;
    private final PermissionRepository permissionRepository;
    private final MinIOService minIOService;

    public AuthServiceImpl(UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            RefreshTokenService refreshTokenService,
            UserMapper userMapper,
            PermissionRepository permissionRepository,
            MinIOService minIOService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.refreshTokenService = refreshTokenService;
        this.userMapper = userMapper;
        this.permissionRepository = permissionRepository;
        this.minIOService = minIOService;
    }

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new ServiceException(Error.INVALID_CREDENTIALS);
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtUtil.createToken(user.getUsername(), loginRequest.isRememberMe());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return LoginResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .build();
    }

    @Override
    @Transactional
    public UserDTO register(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            log.error("Username already exists: {}", registerRequest.getUsername());
            throw new ServiceException(Error.USERNAME_ALREADY_EXIST);
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            log.error("Email already exists: {}", registerRequest.getEmail());
            throw new ServiceException(Error.EMAIL_ALREADY_EXIST);
        }

        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setStatus(Status.ACTIVE.getValue());
        user.setFullName(registerRequest.getFullName());
        user.setProvider(AuthProvider.local);
        user.setRegisteredAt(LocalDateTime.now());
        user = userRepository.save(user);

        Role role = roleRepository.findByName(ERole.ROLE_USER.getValue())
                .orElseThrow(() -> new ServiceException(Error.ROLE_NOT_FOUND));

        UserRole userRole = new UserRole();
        userRole.setRole(role);
        userRole.setUser(user);
        userRoleRepository.save(userRole);

        return userMapper.toDTO(user);
    }

    @Override
    public UserDTO getCurrentUser() {
        String username = SecurityUtil.getCurrentUsername()
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));

        java.util.Set<Role> roles = userRoleRepository.findRoleByUsername(username);
        if (roles != null) {
            user.setRoles(roles.stream().map(Role::getName).collect(java.util.stream.Collectors.toList()));
        }

        UserDTO dto = userMapper.toDTO(user);
        java.util.Set<me.phuongcm.blog.entity.Permission> permissions = permissionRepository
                .findPermissionsByUsername(username);
        if (permissions != null) {
            dto.setPermissions(permissions.stream().map(me.phuongcm.blog.entity.Permission::getTag)
                    .collect(java.util.stream.Collectors.toList()));
        }

        // Resolve imageUrl: path tương đối → full MinIO URL
        if (dto.getImageUrl() != null && !dto.getImageUrl().startsWith("http")) {
            dto.setImageUrl(minIOService.getPublicFileUrl(dto.getImageUrl()));
        }

        return dto;
    }

    @Override
    @Transactional
    public UserDTO changePassword(ChangePasswordRequestDTO changePasswordRequest) {
        User user = userRepository.findByUsername(changePasswordRequest.getUserName())
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));
        user.setPassword(passwordEncoder.encode(changePasswordRequest.getNewPassword()));
        userRepository.save(user);
        return userMapper.toDTO(user);
    }
}
