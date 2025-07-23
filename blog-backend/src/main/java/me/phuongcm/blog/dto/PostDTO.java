package me.phuongcm.blog.dto;

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
    private Long authorId;
    private String authorName;
    private Long parentId;
    private String title;
    private String metaTitle;
    private String slug;
    private String summary;
    private Boolean published;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
    private String content;
    private List<String> tags;
    private List<String> categories;


}
