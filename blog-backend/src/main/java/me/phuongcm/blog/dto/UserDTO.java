package me.phuongcm.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String middleName;
    private String email;
    private String mobile;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private String intro;
    private String profile;


}
