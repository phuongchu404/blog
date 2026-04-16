package me.phuongcm.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String fullName;
    private String firstName;
    private String lastName;
    private String middleName;
    private String email;
    private String mobile;
    private Integer status;
    private String imageUrl;
    private String provider;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private String intro;
    private String profile;
    private List<String> roles;
    private List<String> permissions;
    private Integer membershipStatus; // 0: none, 1: active
    private LocalDateTime membershipExpiredAt;
}
