package me.phuongcm.blog.config;

import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.Cursor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ScanOptions;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class ViewCountSyncScheduler {

    private static final String VIEW_KEY_PREFIX = "post:view:";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private PostRepository postRepository;

    /**
     * Run every 5 minutes (300000 ms) to sync views from Redis to Database
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void syncViewCounts() {
        log.info("Starting view count sync from Redis to Database...");
        
        // Find all keys starting with post:view:
        List<String> keysToProcess = new ArrayList<>();
        try {
            if (redisTemplate.getConnectionFactory() != null) {
                try (Cursor<byte[]> cursor = redisTemplate.getConnectionFactory().getConnection()
                        .scan(ScanOptions.scanOptions().match(VIEW_KEY_PREFIX + "*").build())) {
                    
                    while (cursor.hasNext()) {
                        keysToProcess.add(new String(cursor.next()));
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error scanning redis for view keys", e);
            return;
        }

        if (keysToProcess.isEmpty()) {
            log.debug("No new views to sync.");
            return;
        }

        // Process keys and update database
        for (String key : keysToProcess) {
            try {
                // Extract post ID from key
                String idStr = key.substring(VIEW_KEY_PREFIX.length());
                Long postId = Long.parseLong(idStr);

                // Get increment value and reset it in Redis (atomic operation could be tricky, 
                // but for view counts, simple get and delete/decrement is usually fine)
                Object viewCountObj = redisTemplate.opsForValue().get(key);
                if (viewCountObj != null) {
                    long viewsToAdd = Long.parseLong(viewCountObj.toString());
                    
                    if (viewsToAdd > 0) {
                        Post post = postRepository.findById(postId).orElse(null);
                        if (post != null) {
                            Long currentViews = post.getViewCount() != null ? post.getViewCount() : 0L;
                            post.setViewCount(currentViews + viewsToAdd);
                            postRepository.save(post);
                            
                            // Delete key after syncing to reset the counter
                            redisTemplate.delete(key);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Failed to sync view count for key: {}", key, e);
            }
        }
        
        log.info("View count sync completed for {} posts.", keysToProcess.size());
    }
}
