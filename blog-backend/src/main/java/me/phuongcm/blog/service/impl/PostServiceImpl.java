package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.dto.PostDTO;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.repository.PostRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.service.CategoryService;
import me.phuongcm.blog.dto.PostEvent;
import me.phuongcm.blog.entity.PostDocument;
import me.phuongcm.blog.repository.PostSearchRepository;
import me.phuongcm.blog.service.KafkaProducerService;
import me.phuongcm.blog.service.PostService;
import me.phuongcm.blog.service.TagService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Optional;
@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;

    private final UserRepository userRepository;

    private final TagService tagService;

    private final CategoryService categoryService;

    private final KafkaProducerService kafkaProducerService;

    private final PostSearchRepository postSearchRepository;

    private final RedisTemplate<String, Object> redisTemplate;

    public PostServiceImpl(PostRepository postRepository, UserRepository userRepository, TagService tagService, CategoryService categoryService, RedisTemplate<String, Object> redisTemplate, KafkaProducerService kafkaProducerService, PostSearchRepository postSearchRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.tagService = tagService;
        this.categoryService = categoryService;
        this.redisTemplate = redisTemplate;
        this.kafkaProducerService = kafkaProducerService;
        this.postSearchRepository = postSearchRepository;
    }
    @Override
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    @Override
    @Cacheable(value = "posts", key = "'published'")
    public List<Post> getPublishedPosts() {
        return postRepository.findByPublishedTrue();
    }

    @Override
    public Optional<Post> getPostById(Long id) {
        Optional<Post> post = postRepository.findById(id);
        if (post.isPresent()) {
            incrementViewCountInRedis(id);
        }
        return post;
    }

    @Override
    @Cacheable(value = "posts", key = "#slug")
    public Optional<Post> getPostBySlug(String slug) {
        Optional<Post> post = postRepository.findBySlug(slug);
        post.ifPresent(p -> incrementViewCountInRedis(p.getId()));
        return post;
    }

    private void incrementViewCountInRedis(Long postId) {
        try {
            redisTemplate.opsForValue().increment("post:view:" + postId);
        } catch (Exception e) {
            // Log warning if Redis is down, but don't fail the request
            // log.warn("Failed to increment view count on Redis", e);
        }
    }

    @Override
    public List<Post> getPostsByAuthor(Long authorId) {
        return postRepository.findByAuthorId(authorId);
    }

    @Override
    public List<Post> getPublishedPostsByAuthor(Long authorId) {
        return postRepository.findPublishedByAuthorId(authorId);
    }

    @Override
    public List<Post> getPostsByCategorySlug(String categorySlug) {
        return postRepository.findPublishedByCategorySlug(categorySlug);
    }

    @Override
    public List<Post> getPostsByTagSlug(String tagSlug) {
        return postRepository.findPublishedByTagSlug(tagSlug);
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public Post createPost(PostDTO postDTO) {
        User author = userRepository.findById(postDTO.getAuthorId())
                .orElseThrow(() -> new RuntimeException("Author not found with id: " + postDTO.getAuthorId()));

        Post post = new Post();
        post.setAuthor(author);
        post.setTitle(postDTO.getTitle());
        post.setContent(postDTO.getContent());
        post.setMetaTitle(postDTO.getMetaTitle());
        post.setSlug(generateSlug(postDTO.getTitle()));
        post.setSummary(postDTO.getSummary());
        post.setPublished(postDTO.getPublished() != null ? postDTO.getPublished() : false);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        if(post.getPublished()) {
            post.setPublishedAt(LocalDateTime.now());
        }

        Post savedPost = postRepository.save(post);

        if(postDTO.getTags() != null && !postDTO.getTags().isEmpty()) {
            tagService.addTagsToPost(savedPost, postDTO.getTags());
        }
        if(postDTO.getCategories() != null && !postDTO.getCategories().isEmpty()) {
            categoryService.addCategoriesToPost(savedPost, postDTO.getCategories());
        }

        // Send Kafka Event for Elasticsearch Sync
        PostEvent event = new PostEvent(
                savedPost.getId(),
                PostEvent.EventType.CREATED,
                savedPost.getTitle(),
                savedPost.getSlug(),
                savedPost.getSummary(),
                savedPost.getContent(),
                savedPost.getAuthor().getUsername(),
                savedPost.getPublished()
        );
        kafkaProducerService.sendPostSyncEvent(event);

        return savedPost;
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public Post updatePost(Long id, PostDTO postDTO) {
        Post post =  postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        post.setTitle(postDTO.getTitle());
        post.setMetaTitle(postDTO.getMetaTitle());
        post.setSlug(generateSlug(postDTO.getTitle()));
        post.setSummary(postDTO.getSummary());
        post.setContent(postDTO.getContent());

        Boolean wasPublished = post.getPublished();
        post.setPublished(postDTO.getPublished() != null ? postDTO.getPublished() : false);
        post.setUpdatedAt(LocalDateTime.now());

        if(!wasPublished && post.getPublished()){
            post.setPublishedAt(LocalDateTime.now());
        }

        Post savedPost = postRepository.save(post);

        // Send Kafka Event for Elasticsearch Sync
        PostEvent event = new PostEvent(
                savedPost.getId(),
                PostEvent.EventType.UPDATED,
                savedPost.getTitle(),
                savedPost.getSlug(),
                savedPost.getSummary(),
                savedPost.getContent(),
                savedPost.getAuthor().getUsername(),
                savedPost.getPublished()
        );
        kafkaProducerService.sendPostSyncEvent(event);

        return savedPost;
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        postRepository.delete(post);

        // Send Kafka Event for Elasticsearch Sync
        PostEvent event = new PostEvent();
        event.setPostId(id);
        event.setEventType(PostEvent.EventType.DELETED);
        kafkaProducerService.sendPostSyncEvent(event);
    }

    @Override
    public List<Post> searchPosts(String keyword) {
        // Query Elasticsearch instead of MySQL
        List<PostDocument> documents = postSearchRepository.findByTitleOrContentAndPublishedTrue(keyword, keyword);
        if (documents == null || documents.isEmpty()) {
            // Fallback to MySQL if ES has no results (or indexing pending)
            return postRepository.searchByKeyword(keyword);
        }
        
        List<Long> postIds = documents.stream().map(PostDocument::getPostId).collect(Collectors.toList());
        return postRepository.findAllById(postIds).stream()
                   .filter(Post::getPublished) // Ensure they are published since we might fetch mixed
                   .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public Post publishPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        post.setPublished(true);
        post.setPublishedAt(LocalDateTime.now());

        Post savedPost = postRepository.save(post);

        PostEvent event = new PostEvent();
        event.setPostId(savedPost.getId());
        event.setEventType(PostEvent.EventType.UPDATED);
        event.setTitle(savedPost.getTitle());
        event.setSlug(savedPost.getSlug());
        event.setSummary(savedPost.getSummary());
        event.setContent(savedPost.getContent());
        event.setAuthorName(savedPost.getAuthor().getUsername());
        event.setPublished(true);
        kafkaProducerService.sendPostSyncEvent(event);

        return savedPost;
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public Post unpublishPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        post.setPublished(false);

        Post savedPost = postRepository.save(post);

        PostEvent event = new PostEvent();
        event.setPostId(savedPost.getId());
        event.setEventType(PostEvent.EventType.UPDATED);
        event.setTitle(savedPost.getTitle());
        event.setSlug(savedPost.getSlug());
        event.setSummary(savedPost.getSummary());
        event.setContent(savedPost.getContent());
        event.setAuthorName(savedPost.getAuthor().getUsername());
        event.setPublished(false);
        kafkaProducerService.sendPostSyncEvent(event);

        return savedPost;
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
