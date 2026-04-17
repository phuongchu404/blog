package me.phuongcm.blog.controller;

import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.entity.PostMeta;
import me.phuongcm.blog.service.PostMetaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/posts/{postId}/meta")
@PreAuthorize("hasAuthority('post:meta:manage')")
public class PostMetaController {

    private final PostMetaService postMetaService;

    public PostMetaController(PostMetaService postMetaService) {
        this.postMetaService = postMetaService;
    }

    /** GET /api/posts/{postId}/meta — Get metadata of a post. */
    @GetMapping
    public ResponseEntity<ApiResponse<PostMeta>> getMetaByPost(@PathVariable Long postId) {
        Optional<PostMeta> meta = postMetaService.getMetaByPost(postId);
        return meta.map(m -> ResponseEntity.ok(ApiResponse.ok(m)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Meta not found for post: " + postId)));
    }

    /** PUT /api/posts/{postId}/meta — Create or update metadata. */
    @PutMapping
    public ResponseEntity<ApiResponse<PostMeta>> createOrUpdateMeta(
            @PathVariable Long postId, @RequestBody PostMeta body) {
        PostMeta meta = postMetaService.createOrUpdateMeta(postId,
                body.getMetaTitle(), body.getMetaDescription(), body.getMetaKeywords());
        return ResponseEntity.ok(ApiResponse.ok("Meta updated", meta));
    }

    /** DELETE /api/posts/{postId}/meta — Delete metadata. */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteMeta(@PathVariable Long postId) {
        postMetaService.deleteMeta(postId);
        return ResponseEntity.ok(ApiResponse.ok("Meta deleted", null));
    }
}