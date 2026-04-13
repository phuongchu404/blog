package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.dto.MembershipRequest;
import me.phuongcm.blog.dto.UserDTO;
import me.phuongcm.blog.service.AuthService;
import me.phuongcm.blog.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    /**
     * GET /api/users/me — Thông tin bản thân (bất kỳ user đã đăng nhập).
     * WebSecurityConfig đã yêu cầu authenticated(), không cần @PreAuthorize riêng.
     */
    /**
     * GET /api/users/me — Thông tin bản thân (bất kỳ user đã đăng nhập).
     * WebSecurityConfig đã yêu cầu authenticated(), không cần @PreAuthorize riêng.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        UserDTO user = authService.getCurrentUser();
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/users?username=... — Lấy user theo username.
     * Đã đăng nhập là đủ (thông tin cơ bản).
     */
    @GetMapping
    public ResponseEntity<UserDTO> getUserByUsername(@RequestParam String username) {
        UserDTO user = userService.getCurrentUser(username);
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/users/all — Tất cả người dùng.
     * Yêu cầu permission "user:read:all" (chỉ ROLE_ADMIN).
     */
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('user:read:all')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * GET /api/users/{id} — Xem thông tin user theo ID.
     * Đã đăng nhập là đủ.
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/users/email/{email} — Xem user theo email.
     * Đã đăng nhập là đủ.
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/users/search?keyword=... — Tìm kiếm user theo tên.
     * Yêu cầu permission "user:read:all".
     */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('user:read:all')")
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam String keyword) {
        return ResponseEntity.ok(userService.searchUsers(keyword));
    }

    /**
     * PUT /api/users/{id} — Cập nhật thông tin user.
     * Đã đăng nhập là đủ (để sửa profile bản thân).
     * Dùng "user:update:any" nếu sửa người khác (sẽ kiểm tra ở service layer).
     */
    @Auditable(action = "UPDATE", resource = "USER")
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @Valid @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * DELETE /api/users/{id} — Xóa tài khoản.
     * Yêu cầu permission "user:delete" (chỉ ROLE_ADMIN).
     */
    @Auditable(action = "DELETE", resource = "USER")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('user:delete')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/users/{id}/roles — Phân quyền Role cho user.
     * Yêu cầu permission "user:assign-role".
     */
    @PostMapping("/{id}/roles")
    @PreAuthorize("hasAuthority('user:assign-role')")
    public ResponseEntity<Void> assignRolesToUser(@PathVariable Long id, @RequestBody List<Long> roleIds) {
        userService.assignRolesToUser(id, roleIds);
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/users/{id}/membership — Cấp membership cho user.
     * Yêu cầu permission "membership:manage" (chỉ ROLE_ADMIN).
     */
    @PutMapping("/{id}/membership")
    @PreAuthorize("hasAuthority('membership:manage')")
    public ResponseEntity<UserDTO> grantMembership(@PathVariable Long id,
                                                    @RequestBody(required = false) MembershipRequest request) {
        UserDTO updated = userService.grantMembership(id, request != null ? request.getExpiredAt() : null);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/users/{id}/membership — Thu hồi membership của user.
     * Yêu cầu permission "membership:manage".
     */
    @DeleteMapping("/{id}/membership")
    @PreAuthorize("hasAuthority('membership:manage')")
    public ResponseEntity<UserDTO> revokeMembership(@PathVariable Long id) {
        UserDTO updated = userService.revokeMembership(id);
        return ResponseEntity.ok(updated);
    }
}
