package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.SeriesDTO;
import me.phuongcm.blog.service.SeriesService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/series")
public class SeriesController {

    private final SeriesService seriesService;

    public SeriesController(SeriesService seriesService) {
        this.seriesService = seriesService;
    }

    /** GET /api/series — PUBLIC: tất cả series đã publish */
    @GetMapping
    public ResponseEntity<List<SeriesDTO>> getAllPublished() {
        return ResponseEntity.ok(seriesService.getAllPublished());
    }

    /** GET /api/series/all — ADMIN: tất cả series (kể cả draft) */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SeriesDTO>> getAll() {
        return ResponseEntity.ok(seriesService.getAll());
    }

    /** GET /api/series/slug/{slug} — PUBLIC: lấy series theo slug kèm danh sách bài */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<SeriesDTO> getBySlug(@PathVariable String slug) {
        return seriesService.getBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/series/{id} — ADMIN: lấy theo ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeriesDTO> getById(@PathVariable Long id) {
        return seriesService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** POST /api/series — ADMIN: tạo series mới */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeriesDTO> create(@Valid @RequestBody SeriesDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(seriesService.create(dto));
    }

    /** PUT /api/series/{id} — ADMIN: cập nhật series */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeriesDTO> update(@PathVariable Long id,
                                            @Valid @RequestBody SeriesDTO dto) {
        return ResponseEntity.ok(seriesService.update(id, dto));
    }

    /** DELETE /api/series/{id} — ADMIN: xóa series */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        seriesService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** POST /api/series/{id}/posts — ADMIN: thêm bài vào series */
    @PostMapping("/{id}/posts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeriesDTO> addPost(@PathVariable Long id,
                                             @RequestBody Map<String, Object> body) {
        Long postId = Long.valueOf(body.get("postId").toString());
        Integer orderIndex = body.containsKey("orderIndex")
                ? Integer.valueOf(body.get("orderIndex").toString()) : null;
        return ResponseEntity.ok(seriesService.addPost(id, postId, orderIndex));
    }

    /** DELETE /api/series/{id}/posts/{postId} — ADMIN: gỡ bài khỏi series */
    @DeleteMapping("/{id}/posts/{postId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SeriesDTO> removePost(@PathVariable Long id,
                                                @PathVariable Long postId) {
        return ResponseEntity.ok(seriesService.removePost(id, postId));
    }
}
