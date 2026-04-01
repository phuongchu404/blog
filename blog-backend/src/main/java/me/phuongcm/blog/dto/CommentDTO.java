package me.phuongcm.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentDTO {

    @NotNull(message = "Post ID is required")
    private Long postId;

    @NotNull(message = "User ID is required")
    private Long userId;

    @Size(max = 100, message = "Title must be at most 100 characters")
    private String title;

    @NotBlank(message = "Comment content is required")
    private String content;

    private Long parentId;
}
