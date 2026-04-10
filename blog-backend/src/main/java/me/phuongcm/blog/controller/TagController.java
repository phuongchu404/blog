package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.dto.TagDTO;
import me.phuongcm.blog.service.TagService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    /** GET /api/tags — PUBLIC. */
    @GetMapping
    public ResponseEntity<List<TagDTO>> getAllTags() {
        return ResponseEntity.ok(tagService.getAllTags());
    }

    /** GET /api/tags/search?q={keyword} — PUBLIC. */
    @GetMapping("/search")
    public ResponseEntity<List<TagDTO>> searchTags(@RequestParam(name = "q", defaultValue = "") String keyword) {
        return ResponseEntity.ok(tagService.searchTags(keyword));
    }

    /** GET /api/tags/{id} — PUBLIC. */
    @GetMapping("/{id}")
    public ResponseEntity<TagDTO> getTagById(@PathVariable Long id) {
        return tagService.getTagById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/tags/slug/{slug} — PUBLIC. */
    @GetMapping("/slug/{slug}")
    public ResponseEntity<TagDTO> getTagBySlug(@PathVariable String slug) {
        return tagService.getTagBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/tags — Tạo tag mới.
     * Yêu cầu permission "tag:create" (chỉ ROLE_ADMIN).
     */
    @Auditable(action = "CREATE", resource = "TAG")
    @PostMapping
    @PreAuthorize("hasAuthority('tag:create')")
    public ResponseEntity<TagDTO> createTag(@Valid @RequestBody TagDTO tagDTO) {
        TagDTO created = tagService.createTag(tagDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/tags/{id} — Cập nhật tag.
     * Yêu cầu permission "tag:update".
     */
    @Auditable(action = "UPDATE", resource = "TAG")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('tag:update')")
    public ResponseEntity<TagDTO> updateTag(@PathVariable Long id, @Valid @RequestBody TagDTO tagDTO) {
        TagDTO updated = tagService.updateTag(id, tagDTO);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/tags/{id} — Xóa tag.
     * Yêu cầu permission "tag:delete".
     */
    @Auditable(action = "DELETE", resource = "TAG")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('tag:delete')")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
}
