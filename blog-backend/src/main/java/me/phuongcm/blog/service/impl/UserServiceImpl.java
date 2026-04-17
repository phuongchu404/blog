package me.phuongcm.blog.service.impl;

import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.common.exception.ServiceException;
import me.phuongcm.blog.common.utils.AuthProvider;
import me.phuongcm.blog.common.utils.ERole;
import me.phuongcm.blog.common.utils.Error;
import me.phuongcm.blog.common.utils.Status;
import me.phuongcm.blog.dto.RegisterRequest;
import me.phuongcm.blog.dto.UserDTO;
import me.phuongcm.blog.dto.UserMapper;
import me.phuongcm.blog.entity.Notification;
import me.phuongcm.blog.entity.Role;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.entity.UserRole;
import me.phuongcm.blog.repository.NotificationRepository;
import me.phuongcm.blog.repository.RoleRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.repository.UserRoleRepository;
import me.phuongcm.blog.service.EmailService;
import me.phuongcm.blog.service.MinIOService;
import me.phuongcm.blog.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private MinIOService minIOService;

    @Autowired
    private EmailService emailService;

    @Override
    public UserDTO getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));
        return resolveImageUrl(userMapper.toDTO(user));
    }

    /**
     * Nếu imageUrl là path tương đối thì tạo full URL từ MinIO config, full URL
     * (http) thì giữ nguyên
     */
    private UserDTO resolveImageUrl(UserDTO dto) {
        if (dto != null && dto.getImageUrl() != null && !dto.getImageUrl().startsWith("http")) {
            dto.setImageUrl(minIOService.getPublicFileUrl(dto.getImageUrl()));
        }
        return dto;
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
    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserRole> allUserRoles = userRoleRepository.findAll();
        java.util.Map<Long, List<String>> userRolesMap = allUserRoles.stream()
                .collect(java.util.stream.Collectors.groupingBy(ur -> ur.getUser().getId(),
                        java.util.stream.Collectors.mapping(ur -> ur.getRole().getName(),
                                java.util.stream.Collectors.toList())));
        for (User user : users) {
            user.setRoles(userRolesMap.getOrDefault(user.getId(), java.util.Collections.emptyList()));
        }
        return userMapper.toDTOs(users).stream()
                .map(this::resolveImageUrl)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findById(id).map(userMapper::toDTO);
    }

    @Override
    public Optional<UserDTO> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(userMapper::toDTO);
    }

    @Override
    @Transactional
    public UserDTO createUser(UserDTO userDTO, String password) {
        User user = new User();
        user.setUsername(userDTO.getUsername());
        user.setFullName(userDTO.getFullName());
        user.setFirstName(userDTO.getFirstName());
        user.setMiddleName(userDTO.getMiddleName());
        user.setLastName(userDTO.getLastName());
        user.setMobile(userDTO.getMobile());
        user.setEmail(userDTO.getEmail());
        user.setPassword(passwordEncoder.encode(password));
        user.setCreatedAt(LocalDateTime.now());
        user.setRegisteredAt(LocalDateTime.now());
        user.setIntro(userDTO.getIntro());
        user.setProfile(userDTO.getProfile());
        user.setProvider(AuthProvider.local);
        user.setStatus(Status.ACTIVE.getValue());

        return userMapper.toDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        String nextUsername = userDTO.getUsername() != null ? userDTO.getUsername().trim() : null;
        if (nextUsername != null && !nextUsername.isBlank() && !nextUsername.equals(user.getUsername())) {
            userRepository.findByUsername(nextUsername)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new ServiceException(Error.USERNAME_ALREADY_EXIST);
                    });
            user.setUsername(nextUsername);
        }

        String nextEmail = userDTO.getEmail() != null ? userDTO.getEmail().trim() : null;
        if (nextEmail != null && !nextEmail.isBlank() && !nextEmail.equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(nextEmail)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> {
                        throw new ServiceException(Error.EMAIL_ALREADY_EXIST);
                    });
            user.setEmail(nextEmail);
        }

        user.setFullName(userDTO.getFullName());
        user.setFirstName(userDTO.getFirstName());
        user.setMiddleName(userDTO.getMiddleName());
        user.setLastName(userDTO.getLastName());
        user.setMobile(userDTO.getMobile());
        user.setIntro(userDTO.getIntro());
        user.setProfile(userDTO.getProfile());
        if (userDTO.getImageUrl() != null) {
            user.setImageUrl(userDTO.getImageUrl());
        }

        return resolveImageUrl(userMapper.toDTO(userRepository.save(user)));
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        userRepository.delete(user);
    }

    @Override
    public List<UserDTO> searchUsers(String name) {
        return userMapper.toDTOs(userRepository.findByNameContaining(name));
    }

    @Override
    @Transactional
    public UserDTO requestMembership(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));

        if (user.getMembershipStatus() != null && user.getMembershipStatus() == 1) {
            throw new RuntimeException("Tài khoản đã có membership hợp lệ.");
        }
        if (user.getMembershipStatus() != null && user.getMembershipStatus() == 2) {
            throw new RuntimeException("Yêu cầu membership của bạn đang chờ xét duyệt.");
        }

        user.setMembershipStatus(2); // PENDING
        userRepository.save(user);

        // Gửi thông báo đến tất cả admin
        String msg = "🔑 " + (user.getFullName() != null ? user.getFullName() : user.getUsername())
                + " đã yêu cầu cấp membership.";
        List<Long> adminIds = userRoleRepository.findUserIdsByRoleName("ROLE_ADMIN");
        List<Notification> notifs = adminIds.stream().map(adminId -> Notification.builder()
                .recipientId(adminId)
                .type("MEMBERSHIP_REQUEST")
                .message(msg)
                .createdAt(LocalDateTime.now())
                .read(false)
                .build()).collect(java.util.stream.Collectors.toList());
        notificationRepository.saveAll(notifs);

        return userMapper.toDTO(user);
    }

    @Override
    @Transactional
    public UserDTO grantMembership(Long userId, LocalDateTime expiredAt) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));
        user.setMembershipStatus(1);
        user.setMembershipExpiredAt(expiredAt);
        return userMapper.toDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserDTO revokeMembership(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));
        user.setMembershipStatus(0);
        user.setMembershipExpiredAt(null);
        return userMapper.toDTO(userRepository.save(user));
    }

    @Override
    @Transactional
    public void assignRolesToUser(Long userId, List<Long> roleIds) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));

        userRoleRepository.deleteByUserId(userId);

        if (roleIds != null && !roleIds.isEmpty()) {
            List<Role> roles = roleRepository.findAllById(roleIds);
            List<UserRole> urs = roles.stream().map(r -> {
                UserRole ur = new UserRole();
                ur.setUser(user);
                ur.setRole(r);
                return ur;
            }).collect(java.util.stream.Collectors.toList());

            userRoleRepository.saveAll(urs);
        }
    }

    @Override
    @Transactional
    public void resetPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ServiceException(Error.USER_NOT_FOUND));

        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        String newPassword = sb.toString();

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            String subject = "Khôi phục mật khẩu - Blog Admin";
            String text = "Xin chào " + (user.getFullName() != null ? user.getFullName() : user.getUsername()) + ",\n\n"
                    +
                    "Mật khẩu của bạn đã được đặt lại thành công. Dưới đây là mật khẩu mới của bạn:\n\n" +
                    newPassword + "\n\n" +
                    "Vui lòng đăng nhập và tiến hành đổi mật khẩu ngay lập tức.\n\n" +
                    "Trân trọng,\nBQT Blog Admin";
            emailService.sendTextEmail(user.getEmail(), subject, text);
        }
    }
}
