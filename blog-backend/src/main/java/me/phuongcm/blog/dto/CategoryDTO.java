package me.phuongcm.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CategoryDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 75, message = "Title must be at most 75 characters")
    private String title;

    private String content;

    private Long parentId;
}
