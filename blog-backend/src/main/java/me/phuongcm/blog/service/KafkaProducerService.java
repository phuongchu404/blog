package me.phuongcm.blog.service;

import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.dto.CommentEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class KafkaProducerService {

    private static final String COMMENT_TOPIC = "blog.events.comment";
    private static final String POST_TOPIC = "blog.events.post";

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    public void sendCommentNotificationEvent(CommentEvent event) {
        log.info("Sending Comment Event to Kafka Topic: {} -> {}", COMMENT_TOPIC, event);
        
        // We can use post author id as message key to ensure sequential processing for the same author
        String key = String.valueOf(event.getAuthorId());
        kafkaTemplate.send(COMMENT_TOPIC, key, event);
    }

    public void sendPostSyncEvent(me.phuongcm.blog.dto.PostEvent event) {
        log.info("Sending Post Sync Event to Kafka Topic: {} -> PostID: {}", POST_TOPIC, event.getPostId());
        
        // Use post ID as key to ensure events for the same post are processed in order
        String key = String.valueOf(event.getPostId());
        kafkaTemplate.send(POST_TOPIC, key, event);
    }
}
