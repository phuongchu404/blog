package me.phuongcm.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RoleDTO {
    
    private Long id;
    
    @NotBlank(message = "Role name is required")
    private String name;
    
    private String description;
}
