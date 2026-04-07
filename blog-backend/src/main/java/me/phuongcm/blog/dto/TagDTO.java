package me.phuongcm.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TagDTO {

    private Long id;

    @NotBlank(message = "Tag title is required")
    @Size(max = 75, message = "Title must be at most 75 characters")
    private String title;

    private String content;
    
    private String slug;
    
    private String imageUrl;
}
