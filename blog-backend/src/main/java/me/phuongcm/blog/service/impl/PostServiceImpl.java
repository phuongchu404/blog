package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.common.utils.PublishedStatus;
import me.phuongcm.blog.dto.PostDTO;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.repository.PostRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.service.CategoryService;
import me.phuongcm.blog.service.PostService;
import me.phuongcm.blog.service.TagService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;

    private final UserRepository userRepository;

    private final TagService tagService;

    private final CategoryService categoryService;

    public PostServiceImpl(PostRepository postRepository, UserRepository userRepository, TagService tagService, CategoryService categoryService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.tagService = tagService;
        this.categoryService = categoryService;
    }
    @Override
    public List<Post> getAllPosts() {
        return postRepository.findAll();
    }

    @Override
    public List<Post> getPublishedPosts() {
        return postRepository.findByPublishedTrue();
    }

    @Override
    public Optional<Post> getPostById(Long id) {
        return postRepository.findById(id);
    }

    @Override
    public Optional<Post> getPostBySlug(String slug) {
        return postRepository.findBySlug(slug);
    }

    @Override
    public List<Post> getPostsByAuthor(Long authorId) {
        return postRepository.findByAuthorId(authorId);
    }

    @Override
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
        return savedPost;
    }

    @Override
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

        return postRepository.save(post);
    }

    @Override
    public void deletePost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        postRepository.delete(post);
    }

    @Override
    public List<Post> searchPosts(String keyword) {
        return postRepository.searchByKeyword(keyword);
    }

    @Override
    public Post publishPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        post.setPublished(true);
        post.setPublishedAt(LocalDateTime.now());

        return postRepository.save(post);
    }

    @Override
    public Post unpublishPost(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        post.setPublished(false);

        return postRepository.save(post);
    }

    private String generateSlug(String title) {
        return title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
