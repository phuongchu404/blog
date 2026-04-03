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
public class PermissionDTO {
    
    private Long id;
    
    @NotBlank(message = "Permission name is required (e.g. post:create)")
    private String name;
    
    @NotBlank(message = "Tag is required")
    private String tag;
    
    private String type;
    
    private String method;
    
    private String pattern;
    
    private Integer isWhiteList;
}
