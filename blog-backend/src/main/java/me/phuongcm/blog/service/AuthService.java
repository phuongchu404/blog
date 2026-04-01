package me.phuongcm.blog.service;

import me.phuongcm.blog.dto.LoginRequest;
import me.phuongcm.blog.dto.LoginResponse;
import me.phuongcm.blog.dto.RegisterRequest;
import me.phuongcm.blog.entity.User;

public interface AuthService {

    /**
     * Xác thực và đăng nhập người dùng.
     * @param loginRequest thông tin đăng nhập (username, password, rememberMe)
     * @return LoginResponse chứa JWT token và thông tin user
     */
    LoginResponse login(LoginRequest loginRequest);

    /**
     * Đăng ký tài khoản mới.
     * @param registerRequest thông tin đăng ký
     * @return User vừa được tạo
     */
    User register(RegisterRequest registerRequest);

    /**
     * Lấy thông tin người dùng hiện tại từ SecurityContext.
     * @return User đang đăng nhập
     */
    User getCurrentUser();
}
