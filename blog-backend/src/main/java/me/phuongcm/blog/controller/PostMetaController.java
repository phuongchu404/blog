package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.entity.PostMeta;
import me.phuongcm.blog.service.PostMetaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts/{postId}/meta")
@PreAuthorize("hasAuthority('post:meta:manage')")  // Áp dụng mặc định cho TẤT CẢ endpoints
public class PostMetaController {

    private final PostMetaService postMetaService;

    public PostMetaController(PostMetaService postMetaService) {
        this.postMetaService = postMetaService;
    }

    /** GET /api/posts/{postId}/meta — Tất cả metadata của bài viết. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PostMeta>>> getMetaByPost(@PathVariable Long postId) {
        List<PostMeta> metaList = postMetaService.getMetaByPost(postId);
        return ResponseEntity.ok(ApiResponse.ok(metaList));
    }

    /** GET /api/posts/{postId}/meta/{key} — Metadata theo key. */
    @GetMapping("/{key}")
    public ResponseEntity<ApiResponse<PostMeta>> getMetaByPostAndKey(
            @PathVariable Long postId, @PathVariable String key) {
        Optional<PostMeta> meta = postMetaService.getMetaByPostAndKey(postId, key);
        return meta.map(m -> ResponseEntity.ok(ApiResponse.ok(m)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Meta not found for key: " + key)));
    }

    /** PUT /api/posts/{postId}/meta/{key} — Upsert metadata. Body: {"content": "value"} */
    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<PostMeta>> createOrUpdateMeta(
            @PathVariable Long postId, @PathVariable String key,
            @RequestBody Map<String, String> body) {
        PostMeta meta = postMetaService.CreateOrUpdateMeta(postId, key, body.get("content"));
        return ResponseEntity.ok(ApiResponse.ok("Meta updated", meta));
    }

    /** DELETE /api/posts/{postId}/meta/{key} — Xóa metadata theo key. */
    @DeleteMapping("/{key}")
    public ResponseEntity<ApiResponse<Void>> deleteMeta(
            @PathVariable Long postId, @PathVariable String key) {
        postMetaService.deleteMeta(postId, key);
        return ResponseEntity.ok(ApiResponse.ok("Meta deleted", null));
    }

    /** DELETE /api/posts/{postId}/meta — Xóa toàn bộ metadata. */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAllMeta(@PathVariable Long postId) {
        postMetaService.deleteAllMetaForPost(postId);
        return ResponseEntity.ok(ApiResponse.ok("All meta deleted", null));
    }
}
