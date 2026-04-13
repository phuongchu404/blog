package me.phuongcm.blog.controller;

import me.phuongcm.blog.dto.UserDTO;
import me.phuongcm.blog.security.SecurityUtil;
import me.phuongcm.blog.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/membership")
public class MembershipController {

    private final UserService userService;

    public MembershipController(UserService userService) {
        this.userService = userService;
    }

    /**
     * POST /api/membership/request — User tự yêu cầu cấp membership.
     * Chuyển membershipStatus từ 0 (none) → 2 (pending).
     * Gửi thông báo đến tất cả admin.
     */
    @PostMapping("/request")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> requestMembership() {
        Long userId = SecurityUtil.getCurrentUser()
                .map(u -> u.getId())
                .orElseThrow(() -> new RuntimeException("Chưa đăng nhập"));
        UserDTO updated = userService.requestMembership(userId);
        return ResponseEntity.ok(updated);
    }
}
