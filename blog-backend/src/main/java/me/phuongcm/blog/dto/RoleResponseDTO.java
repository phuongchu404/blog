package me.phuongcm.blog.dto;

import lombok.Getter;
import lombok.Setter;
import me.phuongcm.blog.entity.Permission;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class RoleResponseDTO {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional fields for frontend
    private List<Permission> permissions;
    private long permissionCount;
    private long userCount;
}
