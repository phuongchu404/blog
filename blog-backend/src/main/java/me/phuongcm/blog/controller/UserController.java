package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.UserDTO;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.service.AuthService;
import me.phuongcm.blog.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/users?username=... — Lấy user theo username.
     * Đã đăng nhập là đủ (thông tin cơ bản).
     */
    @GetMapping
    public ResponseEntity<User> getUserByUsername(@RequestParam String username) {
        User user = userService.getCurrentUser(username);
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/users/all — Tất cả người dùng.
     * Yêu cầu permission "user:read:all" (chỉ ROLE_ADMIN).
     */
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('user:read:all')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * GET /api/users/{id} — Xem thông tin user theo ID.
     * Đã đăng nhập là đủ.
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/users/email/{email} — Xem user theo email.
     * Đã đăng nhập là đủ.
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        Optional<User> user = userService.getUserByEmail(email);
        return user.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/users/search?keyword=... — Tìm kiếm user theo tên.
     * Yêu cầu permission "user:read:all".
     */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('user:read:all')")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String keyword) {
        return ResponseEntity.ok(userService.searchUsers(keyword));
    }

    /**
     * PUT /api/users/{id} — Cập nhật thông tin user.
     * Đã đăng nhập là đủ (để sửa profile bản thân).
     * Dùng "user:update:any" nếu sửa người khác (sẽ kiểm tra ở service layer).
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody UserDTO userDTO) {
        User updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * DELETE /api/users/{id} — Xóa tài khoản.
     * Yêu cầu permission "user:delete" (chỉ ROLE_ADMIN).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('user:delete')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
