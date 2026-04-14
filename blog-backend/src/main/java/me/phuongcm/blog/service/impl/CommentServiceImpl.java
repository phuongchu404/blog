package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostComment;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.repository.PostCommentRepository;
import me.phuongcm.blog.repository.PostRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.service.CommentService;
import me.phuongcm.blog.service.KafkaProducerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CommentServiceImpl implements CommentService {
    private final PostCommentRepository commentRepository;

    private final PostRepository postRepository;

    private final UserRepository userRepository;

    private final KafkaProducerService kafkaProducerService;

    public CommentServiceImpl(PostCommentRepository commentRepository, PostRepository postRepository, UserRepository userRepository, KafkaProducerService kafkaProducerService) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.kafkaProducerService = kafkaProducerService;
    }

    @Override
    public List<PostComment> getAllComments() {
        return commentRepository.findAll();
    }

    @Override
    public List<PostComment> getCommentsByPostId(Long postId) {
        return commentRepository.findByPostId(postId);
    }

    @Override
    public List<PostComment> getPublishedCommentsByPostId(Long postId) {
        return commentRepository.findByPostIdAndPublishedTrue(postId);
    }

    @Override
    public List<PostComment> getReplies(Long parentCommentId) {
        return commentRepository.findByParentId(parentCommentId);
    }

    @Override
    @Transactional
    public PostComment createComment(Long postId, Long userId, String title, String content, Long parentId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setUser(user);
        comment.setTitle(title);
        comment.setContent(content);
        // Auto-approve nếu comment đến từ user đã đăng nhập (có userId)
        boolean autoApprove = userId != null;
        comment.setPublished(autoApprove ? true : null);
        comment.setPublishedAt(autoApprove ? LocalDateTime.now() : null);
        comment.setCreatedAt(LocalDateTime.now());

        if (parentId != null) {
            PostComment parentComment = commentRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent comment not found with id: " + parentId));
            comment.setParent(parentComment);
        }

        PostComment savedComment = commentRepository.save(comment);

        // Send Kafka notification only after DB transaction commits successfully
        Long parentCommentUserId;
        if (parentId != null && savedComment.getParent() != null && savedComment.getParent().getUser() != null) {
            parentCommentUserId = savedComment.getParent().getUser().getId();
        } else {
            parentCommentUserId = null;
        }
        me.phuongcm.blog.dto.CommentEvent event = new me.phuongcm.blog.dto.CommentEvent(
                savedComment.getId(),
                post.getId(),
                post.getSlug(),
                post.getTitle(),
                post.getAuthor().getId(),
                user.getId(),
                user.getUsername(),
                content,
                parentCommentUserId
        );
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    kafkaProducerService.sendCommentNotificationEvent(event);
                } catch (Exception e) {
                    System.err.println("Failed to send Kafka comment event: " + e.getMessage());
                }
            }
        });

        return savedComment;
    }

    @Override
    @Transactional
    public PostComment updateComment(Long id, String title, String content) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        comment.setTitle(title);
        comment.setContent(content);

        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long id) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        commentRepository.delete(comment);
    }

    @Override
    @Transactional
    public PostComment approveComment(Long id) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        comment.setPublished(true);
        comment.setPublishedAt(LocalDateTime.now());

        return commentRepository.save(comment);
    }

    @Override
    @Transactional
    public PostComment rejectComment(Long id) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        comment.setPublished(false);

        return commentRepository.save(comment);
    }
}
