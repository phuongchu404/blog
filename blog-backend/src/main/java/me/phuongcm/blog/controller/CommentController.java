package me.phuongcm.blog.controller;

import jakarta.validation.Valid;
import me.phuongcm.blog.dto.CommentDTO;
import me.phuongcm.blog.entity.PostComment;
import me.phuongcm.blog.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;
    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<PostComment>> getCommentsByPostId(@PathVariable Long postId) {
            List<PostComment> comments = commentService.getCommentsByPostId(postId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/post/{postId}/publíshed)")
    public ResponseEntity<List<PostComment>> getPublishedCommentsByPostId(@PathVariable Long postId) {
        List<PostComment> comments = commentService.getPublishedCommentsByPostId(postId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/{commentId}/replies")
    public ResponseEntity<List<PostComment>> getRepliesByCommentId(@PathVariable Long commentId) {
        List<PostComment> replies = commentService.getReplies(commentId);
        return ResponseEntity.ok(replies);
    }

    @PostMapping
    public ResponseEntity<PostComment> createComment(@Valid @RequestBody CommentDTO commentDTO) {
        try {
            PostComment createdComment = commentService.createComment(commentDTO.getPostId(), commentDTO.getUserId(),commentDTO.getTitle(),
                    commentDTO.getContent(), commentDTO.getParentId());
            return ResponseEntity.status(201).body(createdComment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostComment> updateComment(@PathVariable Long id, @Valid @RequestBody CommentDTO commentDTO) {
        try {
            PostComment updatedComment = commentService.updateComment(id, commentDTO.getTitle(), commentDTO.getContent());
            return ResponseEntity.ok(updatedComment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        try {
            commentService.deleteComment(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("{id}/approve")
    public ResponseEntity<PostComment> approveComment(@PathVariable Long id) {
        try {
            PostComment approvedComment = commentService.approveComment(id);
            return ResponseEntity.ok(approvedComment);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("{id}/reject")
    public ResponseEntity<PostComment> rejectComment(@PathVariable Long id) {
        try {
            PostComment rejectedComment = commentService.rejectComment(id);
            return ResponseEntity.ok(rejectedComment);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
