package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.dto.PostDTO;
import me.phuongcm.blog.service.PostService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<PostDTO>> getAllPosts() {
        return ResponseEntity.ok(postService.getAllPosts());
    }

    /** GET /api/posts/published — PUBLIC: lấy bài đã đăng. */
    @GetMapping("/published")
    public ResponseEntity<Page<PostDTO>> getAllPublishedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return ResponseEntity.ok(postService.getPublishedPosts(page, size, sort));
    }

    /** GET /api/posts/{id} — PUBLIC. */
    @GetMapping("/{id}")
    public ResponseEntity<PostDTO> getPostById(@PathVariable Long id) {
        return postService.getPostById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/posts/slug/{slug} — PUBLIC. */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<PostDTO> getPostBySlug(@PathVariable String slug) {
        return postService.getPostBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/posts/search?keyword=... — PUBLIC. */
    @GetMapping("/search")
    public ResponseEntity<List<PostDTO>> searchPosts(@RequestParam String keyword) {
        return ResponseEntity.ok(postService.searchPosts(keyword));
    }

    /** GET /api/posts/author/{authorId} — PUBLIC: bài đã đăng theo tác giả. */
    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<PostDTO>> getPostsByAuthor(@PathVariable Long authorId) {
        return ResponseEntity.ok(postService.getPublishedPostsByAuthor(authorId));
    }

    /** GET /api/posts/category/{slug} — PUBLIC. */
    @GetMapping("/category/{categorySlug}")
    public ResponseEntity<List<PostDTO>> getPostsByCategorySlug(@PathVariable String categorySlug) {
        return ResponseEntity.ok(postService.getPostsByCategorySlug(categorySlug));
    }

    /** GET /api/posts/tag/{slug} — PUBLIC. */
    @GetMapping("/tag/{tagSlug}")
    public ResponseEntity<List<PostDTO>> getPostsByTagSlug(@PathVariable String tagSlug) {
        return ResponseEntity.ok(postService.getPostsByTagSlug(tagSlug));
    }

    /**
     * POST /api/posts — Tạo bài viết mới.
     * Yêu cầu permission "post:create" (có ở ROLE_USER và ROLE_ADMIN).
     */
    @Auditable(action = "CREATE", resource = "POST")
    @PostMapping
    @PreAuthorize("hasAuthority('post:create')")
    public ResponseEntity<PostDTO> createPost(@Valid @RequestBody PostDTO postDTO) {
        PostDTO createdPost = postService.createPost(postDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    /**
     * PUT /api/posts/{id} — Cập nhật bài viết.
     * Yêu cầu permission "post:update:any".
     */
    @Auditable(action = "UPDATE", resource = "POST")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('post:update:any')")
    public ResponseEntity<PostDTO> updatePost(@PathVariable Long id, @Valid @RequestBody PostDTO postDTO) {
        PostDTO updatedPost = postService.updatePost(id, postDTO);
        return ResponseEntity.ok(updatedPost);
    }

    /**
     * DELETE /api/posts/{id} — Xóa bài viết.
     * Yêu cầu permission "post:delete:any".
     */
    @Auditable(action = "DELETE", resource = "POST")
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
    @Auditable(action = "PUBLISH", resource = "POST")
    @PutMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('post:publish')")
    public ResponseEntity<PostDTO> publishPost(@PathVariable Long id) {
        PostDTO publishedPost = postService.publishPost(id);
        return ResponseEntity.ok(publishedPost);
    }

    /**
     * PUT /api/posts/{id}/unpublish — Hủy xuất bản bài viết.
     * Yêu cầu permission "post:publish".
     */
    @Auditable(action = "UNPUBLISH", resource = "POST")
    @PutMapping("/{id}/unpublish")
    @PreAuthorize("hasAuthority('post:publish')")
    public ResponseEntity<PostDTO> unpublishPost(@PathVariable Long id) {
        PostDTO unpublishedPost = postService.unpublishPost(id);
        return ResponseEntity.ok(unpublishedPost);
    }
}
