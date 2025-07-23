package me.phuongcm.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Pattern(regexp = "^[A-Za-z][A-Za-z0-9_]{7,29}$",
             message = "Username must start with a letter, can contain letters, numbers, and underscores, and must be between 8 to 30 characters long")
    private String username; //bat dau bang chu cai, co the chua chu cai, so va dau gach duoi, tu 8 den 30 ky tu

    @NotBlank(message = "Email is required")
    @Pattern(regexp = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
             message = "Email must be a valid email address")
    private String email; // dinh dang email hop le, bat dau bang chu cai, co the chua chu cai, so va dau gach duoi, tu 8 den 30 ky tu

    @NotBlank(message = "Password is required")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=]).{8,}$",
             message = "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character")
    private String password; // mat khau it nhat 8 ky tu, co it nhat 1 chu hoa, 1 chu thuong, 1 so va 1 ky tu dac biet

    private String fullName;

}
