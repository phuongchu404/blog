package me.phuongcm.blog.service;

import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.dto.PostEvent;
import me.phuongcm.blog.entity.PostDocument;
import me.phuongcm.blog.repository.PostSearchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ElasticsearchSyncService {

    @Autowired
    private PostSearchRepository postSearchRepository;

    @KafkaListener(topics = "blog.events.post", groupId = "blog-backend-group")
    public void handlePostSyncEvent(PostEvent event) {
        log.info("📥 [Kafka Consumer - ES Sync] Nhận được sự kiện Post: [{}], ID: {}", event.getEventType(), event.getPostId());
        
        try {
            switch (event.getEventType()) {
                case CREATED:
                case UPDATED:
                    // Create or Update Document in ES
                    PostDocument document = new PostDocument();
                    // Just generate a random ID for ES document or use String value of postId
                    document.setId(String.valueOf(event.getPostId())); 
                    document.setPostId(event.getPostId());
                    document.setTitle(event.getTitle());
                    document.setSlug(event.getSlug());
                    document.setSummary(event.getSummary());
                    document.setContent(event.getContent());
                    document.setAuthorName(event.getAuthorName());
                    document.setStatus(event.getStatus());
                    
                    postSearchRepository.save(document);
                    log.info("✅ Đã đồng bộ bài viết [{}] lên Elasticsearch thành công!", document.getTitle());
                    break;
                    
                case DELETED:
                    // Remove Document from ES
                    postSearchRepository.deleteById(String.valueOf(event.getPostId()));
                    log.info("🗑️ Đã xoá bài viết [{}] khỏi Elasticsearch thành công!", event.getPostId());
                    break;
            }
        } catch (Exception e) {
            log.error("❌ Lỗi khi đồng bộ dữ liệu lên Elasticsearch: {}", e.getMessage(), e);
        }
    }
}
