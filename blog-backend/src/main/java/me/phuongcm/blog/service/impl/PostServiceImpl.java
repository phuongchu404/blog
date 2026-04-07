package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.dto.PostMapper;
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
import me.phuongcm.blog.common.utils.SlugUtils;
import me.phuongcm.blog.service.PostService;
import me.phuongcm.blog.service.TagService;
import me.phuongcm.blog.service.UploadTrackerService;
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

    private final UploadTrackerService uploadTrackerService;

    private final PostMapper postMapper;

    public PostServiceImpl(PostRepository postRepository, UserRepository userRepository, TagService tagService, CategoryService categoryService, RedisTemplate<String, Object> redisTemplate, KafkaProducerService kafkaProducerService, PostSearchRepository postSearchRepository, UploadTrackerService uploadTrackerService, PostMapper postMapper) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.tagService = tagService;
        this.categoryService = categoryService;
        this.redisTemplate = redisTemplate;
        this.kafkaProducerService = kafkaProducerService;
        this.postSearchRepository = postSearchRepository;
        this.uploadTrackerService = uploadTrackerService;
        this.postMapper = postMapper;
    }
    @Override
    public List<PostDTO> getAllPosts() {
        return postMapper.toDTOs(postRepository.findAll());
    }

    @Override
    @Cacheable(value = "posts", key = "'published'")
    public List<PostDTO> getPublishedPosts() {
        return postMapper.toDTOs(postRepository.findByStatus(1));
    }

    @Override
    public Optional<PostDTO> getPostById(Long id) {
        Optional<Post> post = postRepository.findById(id);
        if (post.isPresent()) {
            incrementViewCountInRedis(id);
        }
        return post.map(postMapper::toDTO);
    }

    @Override
    @Cacheable(value = "posts", key = "#slug")
    public Optional<PostDTO> getPostBySlug(String slug) {
        Optional<Post> post = postRepository.findBySlug(slug);
        post.ifPresent(p -> incrementViewCountInRedis(p.getId()));
        return post.map(postMapper::toDTO);
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
    public List<PostDTO> getPostsByAuthor(Long authorId) {
        return postMapper.toDTOs(postRepository.findByAuthorId(authorId));
    }

    @Override
    public List<PostDTO> getPublishedPostsByAuthor(Long authorId) {
        return postMapper.toDTOs(postRepository.findPublishedByAuthorId(authorId));
    }

    @Override
    public List<PostDTO> getPostsByCategorySlug(String categorySlug) {
        return postMapper.toDTOs(postRepository.findPublishedByCategorySlug(categorySlug));
    }

    @Override
    public List<PostDTO> getPostsByTagSlug(String tagSlug) {
        return postMapper.toDTOs(postRepository.findPublishedByTagSlug(tagSlug));
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public PostDTO createPost(PostDTO postDTO) {
        User author = userRepository.findById(postDTO.getAuthorId())
                .orElseThrow(() -> new RuntimeException("Author not found with id: " + postDTO.getAuthorId()));

        Post post = new Post();
        post.setAuthor(author);
        post.setTitle(postDTO.getTitle());
        post.setContent(postDTO.getContent());
        post.setMetaTitle(postDTO.getMetaTitle());
        post.setSlug(generateSlug(postDTO.getTitle()));
        post.setSummary(postDTO.getSummary());
        post.setStatus(postDTO.getStatus() != null ? postDTO.getStatus() : 0);
        post.setImageUrl(postDTO.getImageUrl());
        post.setMetaDescription(postDTO.getMetaDescription());
        post.setMetaKeywords(postDTO.getMetaKeywords());
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());

        if (post.getStatus() == 1) {
            post.setPublishedAt(LocalDateTime.now());
        }

        Post savedPost = postRepository.save(post);

        if(postDTO.getTagIds() != null && !postDTO.getTagIds().isEmpty()) {
            tagService.addTagsToPost(savedPost, postDTO.getTagIds());
        }
        if(postDTO.getCategoryIds() != null && !postDTO.getCategoryIds().isEmpty()) {
            categoryService.addCategoriesToPost(savedPost, postDTO.getCategoryIds());
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
                savedPost.getStatus()
        );
        kafkaProducerService.sendPostSyncEvent(event);

        // Mark any uploaded files in content as explicitly USED
        uploadTrackerService.markAsUsedFromHtmlContent(savedPost.getContent());

        return postMapper.toDTO(savedPost);
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public PostDTO updatePost(Long id, PostDTO postDTO) {
        Post post =  postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        post.setTitle(postDTO.getTitle());
        post.setMetaTitle(postDTO.getMetaTitle());
        post.setSlug(generateSlug(postDTO.getTitle()));
        post.setSummary(postDTO.getSummary());
        post.setContent(postDTO.getContent());
        post.setImageUrl(postDTO.getImageUrl());
        post.setMetaDescription(postDTO.getMetaDescription());
        post.setMetaKeywords(postDTO.getMetaKeywords());

        Integer oldStatus = post.getStatus();
        post.setStatus(postDTO.getStatus() != null ? postDTO.getStatus() : 0);
        post.setUpdatedAt(LocalDateTime.now());

        if (oldStatus != 1 && post.getStatus() == 1) {
            post.setPublishedAt(LocalDateTime.now());
        }

        Post savedPost = postRepository.save(post);

        // Sync Tags (Clear and re-add)
        if (postDTO.getTagIds() != null) {
            tagService.clearTagsFromPost(savedPost);
            if (!postDTO.getTagIds().isEmpty()) {
                tagService.addTagsToPost(savedPost, postDTO.getTagIds());
            }
        }
        // Sync Categories (Clear and re-add)
        if (postDTO.getCategoryIds() != null) {
            categoryService.clearCategoriesFromPost(savedPost);
            if (!postDTO.getCategoryIds().isEmpty()) {
                categoryService.addCategoriesToPost(savedPost, postDTO.getCategoryIds());
            }
        }

        // Send Kafka Event for Elasticsearch Sync
        PostEvent event = new PostEvent(
                savedPost.getId(),
                PostEvent.EventType.UPDATED,
                savedPost.getTitle(),
                savedPost.getSlug(),
                savedPost.getSummary(),
                savedPost.getContent(),
                savedPost.getAuthor().getUsername(),
                savedPost.getStatus()
        );
        kafkaProducerService.sendPostSyncEvent(event);

        // Mark any uploaded files in content as explicitly USED
        uploadTrackerService.markAsUsedFromHtmlContent(savedPost.getContent());

        return postMapper.toDTO(savedPost);
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
    public List<PostDTO> searchPosts(String keyword) {
        // Query Elasticsearch instead of MySQL
        List<PostDocument> documents = postSearchRepository.findPublishedByKeyword(keyword);
        if (documents == null || documents.isEmpty()) {
            // Fallback to MySQL if ES has no results (or indexing pending)
            return postMapper.toDTOs(postRepository.searchByKeyword(keyword));
        }
        
        List<Long> postIds = documents.stream().map(PostDocument::getPostId).collect(Collectors.toList());
        List<Post> posts = postRepository.findAllById(postIds).stream()
                   .filter(p -> p.getStatus() == 1) // Ensure they are published since we might fetch mixed
                   .collect(Collectors.toList());
        return postMapper.toDTOs(posts);
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public PostDTO publishPost(Long id) {
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
        event.setStatus(1);
        kafkaProducerService.sendPostSyncEvent(event);

        return postMapper.toDTO(savedPost);
    }

    @Override
    @CacheEvict(value = "posts", allEntries = true)
    public PostDTO unpublishPost(Long id) {
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
        event.setStatus(0);
        kafkaProducerService.sendPostSyncEvent(event);

        return postMapper.toDTO(savedPost);
    }

    private String generateSlug(String title) {
        return SlugUtils.toSlug(title);
    }
}
