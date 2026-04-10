package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notification_recipient", columnList = "recipient_id"),
        @Index(name = "idx_notification_read", columnList = "is_read")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID người nhận thông báo */
    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    /**
     * Loại thông báo:
     * NEW_COMMENT  — có bình luận mới trên bài viết của bạn
     * REPLY_COMMENT — có người reply bình luận của bạn
     */
    @Column(name = "type", length = 30, nullable = false)
    private String type;

    @Column(name = "message", length = 500, nullable = false)
    private String message;

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "post_slug", length = 255)
    private String postSlug;

    @Column(name = "post_title", length = 300)
    private String postTitle;

    @Column(name = "comment_id")
    private Long commentId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
