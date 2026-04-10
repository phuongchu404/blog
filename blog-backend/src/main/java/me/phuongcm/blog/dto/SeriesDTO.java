package me.phuongcm.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SeriesDTO {

    private Long id;

    @NotBlank(message = "Title is required")
    @Size(max = 100, message = "Title must be at most 100 characters")
    private String title;

    private String slug;

    private String description;

    private String imageUrl;

    private Boolean published = false;

    private Integer postCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<PostSummary> posts;

    /** Thông tin tóm tắt 1 bài viết trong series */
    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PostSummary {
        private Long id;
        private String title;
        private String slug;
        private String summary;
        private String imageUrl;
        private Integer orderIndex;
    }
}
