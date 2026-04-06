package me.phuongcm.blog.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequestDTO {
    private String userName;
    private String newPassword;
}
