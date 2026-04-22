package me.phuongcm.blog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.dto.CommentEvent;
import me.phuongcm.blog.entity.Notification;
import me.phuongcm.blog.repository.NotificationRepository;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationStreamService notificationStreamService;

    /**
     * Kafka consumer — lắng nghe sự kiện comment mới.
     * Tạo notification cho:
     *   1. Tác giả bài viết (khi có bình luận mới, trừ khi tự comment bài của mình)
     *   2. Chủ bình luận cha (khi có reply, trừ khi reply chính bình luận của mình)
     */
    @KafkaListener(topics = "blog.events.comment", groupId = "blog-backend-group")
    public void handleCommentEvent(CommentEvent event) {
        log.info("[Notification] Comment mới: postId={}, commenter={}", event.getPostId(), event.getCommenterName());

        // 1. Thông báo cho tác giả bài viết (nếu người comment không phải tác giả)
        if (event.getPostAuthorId() != null
                && !event.getPostAuthorId().equals(event.getCommenterId())) {
            String msg = String.format("%s đã bình luận bài viết \"%s\"",
                    event.getCommenterName(), event.getPostTitle());
            saveNotification(event.getPostAuthorId(), "NEW_COMMENT", msg,
                    event.getPostId(), event.getPostSlug(), event.getPostTitle(), event.getCommentId());
        }

        // 2. Thông báo cho chủ bình luận cha (nếu là reply và khác người)
        if (event.getParentCommentUserId() != null
                && !event.getParentCommentUserId().equals(event.getCommenterId())) {
            String msg = String.format("%s đã trả lời bình luận của bạn trong bài \"%s\"",
                    event.getCommenterName(), event.getPostTitle());
            saveNotification(event.getParentCommentUserId(), "REPLY_COMMENT", msg,
                    event.getPostId(), event.getPostSlug(), event.getPostTitle(), event.getCommentId());
        }
    }

    private void saveNotification(Long recipientId, String type, String message,
                                   Long postId, String postSlug, String postTitle, Long commentId) {
        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .type(type)
                .message(message)
                .postId(postId)
                .postSlug(postSlug)
                .postTitle(postTitle)
                .commentId(commentId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
        Notification savedNotification = notificationRepository.save(notification);
        notificationStreamService.publishNotification(savedNotification);
        log.info("[Notification] Đã lưu thông báo cho userId={}: {}", recipientId, message);
    }
}
