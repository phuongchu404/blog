package me.phuongcm.blog.service;

import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.dto.CommentEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    @KafkaListener(topics = "blog.events.comment", groupId = "blog-backend-group")
    public void handleCommentEvent(CommentEvent event) {
        log.info("📥 [Kafka Consumer] Nhận được sự kiện Bình luận mới!");
        log.info("Tác giả bài viết ID [{}]: Bạn có một bình luận mới từ [{}]", event.getAuthorId(), event.getCommenterName());
        log.info("Bài viết: {}", event.getPostTitle());
        log.info("Nội dung bình luận: {}", event.getContent());
        
        // TODO: Gọi thư viện JavaMailSender gửi email thông báo
        log.info("✅ [Kafka Consumer] Đã mô phỏng gửi Email thông báo thành công!");
    }
}
