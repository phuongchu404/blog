package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.PostDTO;
import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.service.PostService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    /**
     * GET /api/posts — Xem TẤT CẢ bài viết kể cả unpublished.
     * Chỉ ADMIN hoặc có permission "post:read:all".
     */
    @GetMapping
    @PreAuthorize("hasAuthority('post:read:all')")
    public ResponseEntity<List<Post>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    /** GET /api/posts/published — PUBLIC: lấy bài đã đăng. */
    @GetMapping("/published")
    public ResponseEntity<List<Post>> getAllPublishedPosts() {
        return ResponseEntity.ok(postService.getPublishedPosts());
    }

    /** GET /api/posts/{id} — PUBLIC. */
    @GetMapping("/{id}")
    public ResponseEntity<Post> getPostById(@PathVariable Long id) {
        Optional<Post> post = postService.getPostById(id);
        return post.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/posts/slug/{slug} — PUBLIC. */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<Post> getPostBySlug(@PathVariable String slug) {
        return postService.getPostBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/posts/search?keyword=... — PUBLIC. */
    @GetMapping("/search")
    public ResponseEntity<List<Post>> searchPosts(@RequestParam String keyword) {
        return ResponseEntity.ok(postService.searchPosts(keyword));
    }

    /** GET /api/posts/author/{authorId} — PUBLIC: bài đã đăng theo tác giả. */
    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<Post>> getPostsByAuthor(@PathVariable Long authorId) {
        return ResponseEntity.ok(postService.getPublishedPostsByAuthor(authorId));
    }

    /** GET /api/posts/category/{slug} — PUBLIC. */
    @GetMapping("/category/{categorySlug}")
    public ResponseEntity<List<Post>> getPostsByCategorySlug(@PathVariable String categorySlug) {
        return ResponseEntity.ok(postService.getPostsByCategorySlug(categorySlug));
    }

    /** GET /api/posts/tag/{slug} — PUBLIC. */
    @GetMapping("/tag/{tagSlug}")
    public ResponseEntity<List<Post>> getPostsByTagSlug(@PathVariable String tagSlug) {
        return ResponseEntity.ok(postService.getPostsByTagSlug(tagSlug));
    }

    /**
     * POST /api/posts — Tạo bài viết mới.
     * Yêu cầu permission "post:create" (có ở ROLE_USER và ROLE_ADMIN).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('post:create')")
    public ResponseEntity<Post> createPost(@Valid @RequestBody PostDTO postDTO) {
        Post createdPost = postService.createPost(postDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    /**
     * PUT /api/posts/{id} — Cập nhật bài viết.
     * Yêu cầu permission "post:update:any".
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('post:update:any')")
    public ResponseEntity<Post> updatePost(@PathVariable Long id, @Valid @RequestBody PostDTO postDTO) {
        Post updatedPost = postService.updatePost(id, postDTO);
        return ResponseEntity.ok(updatedPost);
    }

    /**
     * DELETE /api/posts/{id} — Xóa bài viết.
     * Yêu cầu permission "post:delete:any".
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('post:delete:any')")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        postService.deletePost(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/posts/{id}/publish — Xuất bản bài viết.
     * Yêu cầu permission "post:publish" (chỉ ROLE_ADMIN có).
     */
    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('post:publish')")
    public ResponseEntity<Post> publishPost(@PathVariable Long id) {
        Post publishedPost = postService.publishPost(id);
        return ResponseEntity.ok(publishedPost);
    }

    /**
     * PUT /api/posts/{id}/unpublish — Hủy xuất bản bài viết.
     * Yêu cầu permission "post:publish".
     */
    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAuthority('post:publish')")
    public ResponseEntity<Post> unpublishPost(@PathVariable Long id) {
        Post unpublishedPost = postService.unpublishPost(id);
        return ResponseEntity.ok(unpublishedPost);
    }
}
