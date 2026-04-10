package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.dto.*;
import me.phuongcm.blog.entity.RefreshToken;
import me.phuongcm.blog.common.exception.TokenRefreshException;
import me.phuongcm.blog.security.jwt.JwtUtil;
import me.phuongcm.blog.security.service.RefreshTokenService;
import me.phuongcm.blog.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;

    public AuthController(AuthService authService, RefreshTokenService refreshTokenService, JwtUtil jwtUtil) {
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
        this.jwtUtil = jwtUtil;
    }

    /**
     * POST /auth/login
     * Đăng nhập bằng username và password, trả về JWT token.
     *
     * Body: { "username": "...", "password": "...", "rememberMe": false }
     * Response: { "accessToken": "...", "tokenType": "Bearer", "userId": 1, "username": "...", ... }
     */
    @Auditable(action = "LOGIN", resource = "AUTH")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    /**
     * POST /auth/register
     * Đăng ký tài khoản mới với username/email/password.
     *
     * Body: { "username": "...", "email": "...", "password": "...", "fullName": "..." }
     * Response: { "success": true, "message": "Registered successfully", "data": { ...userInfo } }
     */
    @Auditable(action = "REGISTER", resource = "AUTH")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDTO>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        UserDTO user = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registered successfully", user));
    }

    /**
     * GET /auth/me
     * Lấy thông tin người dùng đang đăng nhập (yêu cầu JWT token trong header Authorization).
     *
     * Header: Authorization: Bearer {token}
     * Response: { "success": true, "data": { ...userInfo } }
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser() {
        UserDTO user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    /**
     * POST /auth/refresh
     * Đổi Refresh Token lấy Access Token mới.
     *
     * Body: { "refreshToken": "..." }
     * Response: { "accessToken": "...", "refreshToken": "..." }
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenRefreshResponse>> refreshtoken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtUtil.createToken(user.getUsername());
                    return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", new TokenRefreshResponse(token, requestRefreshToken)));
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
                        "Refresh token is not in database!"));
    }

    /**
     * POST /auth/logout
     * Xóa Refresh Token của người dùng đang đăng nhập.
     *
     * Yêu cầu: Header Authorization: Bearer {token}
     */
    @Auditable(action = "LOGOUT", resource = "AUTH")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logoutUser() {
        UserDTO user = authService.getCurrentUser();
        refreshTokenService.deleteByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Log out successful", null));
    }

    @Auditable(action = "CHANGE_PASSWORD", resource = "AUTH")
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<UserDTO>> changePassword(@Valid @RequestBody ChangePasswordRequestDTO changePasswordRequest) {
        UserDTO user = authService.changePassword(changePasswordRequest);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", user));
    }
}
