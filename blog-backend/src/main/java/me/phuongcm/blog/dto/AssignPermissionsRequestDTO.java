package me.phuongcm.blog.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AssignPermissionsRequestDTO {
    private List<Long> permissionIds;
}
