package me.phuongcm.blog.service;


import me.phuongcm.blog.entity.PostComment;

import java.util.List;

public interface CommentService {
    List<PostComment> getCommentsByPostId(Long postId);

    List<PostComment> getPublishedCommentsByPostId(Long postId);

    List<PostComment> getReplies(Long parentCommentId);

    PostComment createComment(Long postId, Long userId, String title, String content, Long parentId);

    PostComment updateComment(Long id, String title, String content);

    void deleteComment(Long id);

    PostComment approveComment(Long id);

    PostComment rejectComment(Long id);
}
