package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostComment;
import me.phuongcm.blog.entity.User;
import me.phuongcm.blog.repository.PostCommentRepository;
import me.phuongcm.blog.repository.PostRepository;
import me.phuongcm.blog.repository.UserRepository;
import me.phuongcm.blog.service.CommentService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
@Service
public class CommentServiceImpl implements CommentService {
    private final PostCommentRepository commentRepository;

    private final PostRepository postRepository;

    private final UserRepository userRepository;

    public CommentServiceImpl(PostCommentRepository commentRepository, PostRepository postRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
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
        comment.setPublished(false);
        comment.setCreatedAt(LocalDateTime.now());

        if (parentId != null) {
            PostComment parentComment = commentRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent comment not found with id: " + parentId));
            comment.setParentComment(parentComment);
        }
        return commentRepository.save(comment);
    }

    @Override
    public PostComment updateComment(Long id, String title, String content) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        comment.setTitle(title);
        comment.setContent(content);

        return commentRepository.save(comment);
    }

    @Override
    public void deleteComment(Long id) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        commentRepository.delete(comment);
    }

    @Override
    public PostComment approveComment(Long id) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        comment.setPublished(true);
        comment.setPublishedAt(LocalDateTime.now());

        return commentRepository.save(comment);
    }

    @Override
    public PostComment rejectComment(Long id) {
        PostComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));

        comment.setPublished(false);

        return commentRepository.save(comment);
    }
}
