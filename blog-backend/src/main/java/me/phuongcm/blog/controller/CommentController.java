package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.dto.CommentDTO;
import me.phuongcm.blog.dto.CommentResponseDTO;
import me.phuongcm.blog.entity.PostComment;
import me.phuongcm.blog.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    /**
     * GET /api/comments — Tất cả bình luận (admin/moderator).
     * Yêu cầu permission "comment:read:all".
     */
    @GetMapping
    @PreAuthorize("hasAuthority('comment:read:all')")
    public ResponseEntity<List<CommentResponseDTO>> getAllComments() {
        List<CommentResponseDTO> result = commentService.getAllComments()
                .stream().map(CommentResponseDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/comments/post/{postId} — Tất cả bình luận (kể cả pending).
     * Yêu cầu permission "comment:read:all" (ROLE_ADMIN, ROLE_MODERATOR).
     */
    @GetMapping("/post/{postId}")
    @PreAuthorize("hasAuthority('comment:read:all')")
    public ResponseEntity<List<CommentResponseDTO>> getCommentsByPostId(@PathVariable Long postId) {
        List<CommentResponseDTO> result = commentService.getCommentsByPostId(postId)
                .stream().map(CommentResponseDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** GET /api/comments/post/{postId}/published — PUBLIC: bình luận đã duyệt. */
    @GetMapping("/post/{postId}/published")
    public ResponseEntity<List<CommentResponseDTO>> getPublishedCommentsByPostId(@PathVariable Long postId) {
        List<CommentResponseDTO> result = commentService.getPublishedCommentsByPostId(postId)
                .stream().map(CommentResponseDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** GET /api/comments/{commentId}/replies — PUBLIC: các reply. */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<List<CommentResponseDTO>> getRepliesByCommentId(@PathVariable Long commentId) {
        List<CommentResponseDTO> result = commentService.getReplies(commentId)
                .stream().map(CommentResponseDTO::from).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/comments — Tạo bình luận (mặc định chờ duyệt).
     * Yêu cầu permission "comment:create" (ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR).
     */
    @Auditable(action = "CREATE", resource = "COMMENT")
    @PostMapping
    @PreAuthorize("hasAuthority('comment:create')")
    public ResponseEntity<CommentResponseDTO> createComment(@Valid @RequestBody CommentDTO commentDTO) {
        PostComment created = commentService.createComment(
                commentDTO.getPostId(), commentDTO.getUserId(),
                commentDTO.getTitle(), commentDTO.getContent(), commentDTO.getParentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(CommentResponseDTO.from(created));
    }

    /**
     * PUT /api/comments/{id} — Cập nhật bình luận.
     * Yêu cầu permission "comment:update:any".
     */
    @Auditable(action = "UPDATE", resource = "COMMENT")
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('comment:update:any')")
    public ResponseEntity<CommentResponseDTO> updateComment(
            @PathVariable Long id, @Valid @RequestBody CommentDTO commentDTO) {
        PostComment updated = commentService.updateComment(
                id, commentDTO.getTitle(), commentDTO.getContent());
        return ResponseEntity.ok(CommentResponseDTO.from(updated));
    }

    /**
     * DELETE /api/comments/{id} — Xóa bình luận.
     * Yêu cầu permission "comment:delete:any".
     */
    @Auditable(action = "DELETE", resource = "COMMENT")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('comment:delete:any')")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/comments/{id}/approve — Duyệt bình luận (published = true).
     * Yêu cầu permission "comment:moderate" (ROLE_ADMIN, ROLE_MODERATOR).
     */
    @Auditable(action = "APPROVE", resource = "COMMENT")
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('comment:moderate')")
    public ResponseEntity<CommentResponseDTO> approveComment(@PathVariable Long id) {
        return ResponseEntity.ok(CommentResponseDTO.from(commentService.approveComment(id)));
    }

    /**
     * PUT /api/comments/{id}/reject — Từ chối bình luận (published = false).
     * Yêu cầu permission "comment:moderate".
     */
    @Auditable(action = "REJECT", resource = "COMMENT")
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('comment:moderate')")
    public ResponseEntity<CommentResponseDTO> rejectComment(@PathVariable Long id) {
        return ResponseEntity.ok(CommentResponseDTO.from(commentService.rejectComment(id)));
    }
}
