package me.phuongcm.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class PostDTO {

    private Long id;

    @NotNull(message = "Author ID is required")
    private Long authorId;

    private String authorName;
    private String categoryName;

    private Long parentId;

    @NotBlank(message = "Title is required")
    @Size(max = 75, message = "Title must be at most 75 characters")
    private String title;

    @Size(max = 100, message = "Meta title must be at most 100 characters")
    private String metaTitle;

    private String slug;

    private String summary;

    private String metaDescription;
    private String metaKeywords;
    private String imageUrl;
    private Integer status; // 0: Draft, 1: Published, 2: Archived

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime publishedAt;

    @NotBlank(message = "Content is required")
    private String content;

    private List<Long> tagIds;
    private List<Long> categoryIds;

    private List<TagDTO> tags;
    private List<CategoryDTO> categories;
}
