package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.CommentDTO;
import me.phuongcm.blog.entity.PostComment;
import me.phuongcm.blog.service.CommentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    /**
     * GET /api/comments/post/{postId} — Tất cả bình luận (kể cả pending).
     * Yêu cầu permission "comment:read:all" (ROLE_ADMIN, ROLE_MODERATOR).
     */
    @GetMapping("/post/{postId}")
    @PreAuthorize("hasAuthority('comment:read:all')")
    public ResponseEntity<List<PostComment>> getCommentsByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getCommentsByPostId(postId));
    }

    /** GET /api/comments/post/{postId}/published — PUBLIC: bình luận đã duyệt. */
    @GetMapping("/post/{postId}/published")
    public ResponseEntity<List<PostComment>> getPublishedCommentsByPostId(@PathVariable Long postId) {
        return ResponseEntity.ok(commentService.getPublishedCommentsByPostId(postId));
    }

    /** GET /api/comments/{commentId}/replies — PUBLIC: các reply. */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<List<PostComment>> getRepliesByCommentId(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.getReplies(commentId));
    }

    /**
     * POST /api/comments — Tạo bình luận (mặc định chờ duyệt).
     * Yêu cầu permission "comment:create" (ROLE_USER, ROLE_ADMIN, ROLE_MODERATOR).
     */
    @PostMapping
    @PreAuthorize("hasAuthority('comment:create')")
    public ResponseEntity<PostComment> createComment(@Valid @RequestBody CommentDTO commentDTO) {
        PostComment created = commentService.createComment(
                commentDTO.getPostId(), commentDTO.getUserId(),
                commentDTO.getTitle(), commentDTO.getContent(), commentDTO.getParentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * PUT /api/comments/{id} — Cập nhật bình luận.
     * Yêu cầu permission "comment:update:any".
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('comment:update:any')")
    public ResponseEntity<PostComment> updateComment(
            @PathVariable Long id, @Valid @RequestBody CommentDTO commentDTO) {
        PostComment updated = commentService.updateComment(
                id, commentDTO.getTitle(), commentDTO.getContent());
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/comments/{id} — Xóa bình luận.
     * Yêu cầu permission "comment:delete:any".
     */
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
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('comment:moderate')")
    public ResponseEntity<PostComment> approveComment(@PathVariable Long id) {
        PostComment approved = commentService.approveComment(id);
        return ResponseEntity.ok(approved);
    }

    /**
     * PUT /api/comments/{id}/reject — Từ chối bình luận (published = false).
     * Yêu cầu permission "comment:moderate".
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAuthority('comment:moderate')")
    public ResponseEntity<PostComment> rejectComment(@PathVariable Long id) {
        PostComment rejected = commentService.rejectComment(id);
        return ResponseEntity.ok(rejected);
    }
}
