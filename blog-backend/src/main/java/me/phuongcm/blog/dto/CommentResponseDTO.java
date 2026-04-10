package me.phuongcm.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.phuongcm.blog.entity.PostComment;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponseDTO {

    private Long id;
    private Long postId;
    private Long parentId;
    private String title;
    private String content;
    private Boolean published;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime publishedAt;
    private UserSummary user;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String fullName;
        private String imageUrl;
    }

    public static CommentResponseDTO from(PostComment c) {
        if (c == null) return null;
        UserSummary userSummary = null;
        if (c.getUser() != null) {
            userSummary = new UserSummary(
                    c.getUser().getId(),
                    c.getUser().getUsername(),
                    c.getUser().getFullName(),
                    c.getUser().getImageUrl()
            );
        }
        String status;
        if (Boolean.TRUE.equals(c.getPublished())) {
            status = "APPROVED";
        } else if (Boolean.FALSE.equals(c.getPublished())) {
            status = "SPAM";
        } else {
            status = "PENDING";
        }
        return new CommentResponseDTO(
                c.getId(),
                c.getPost() != null ? c.getPost().getId() : null,
                c.getParent() != null ? c.getParent().getId() : null,
                c.getTitle(),
                c.getContent(),
                c.getPublished(),
                status,
                c.getCreatedAt(),
                c.getPublishedAt(),
                userSummary
        );
    }
}
