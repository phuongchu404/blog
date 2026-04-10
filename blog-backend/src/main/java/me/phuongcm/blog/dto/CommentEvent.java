package me.phuongcm.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CommentEvent {
    private Long commentId;
    private Long postId;
    private String postSlug;
    private String postTitle;
    private Long postAuthorId;        // ID tác giả bài viết
    private Long commenterId;         // ID người comment
    private String commenterName;
    private String content;
    private Long parentCommentUserId; // ID chủ bình luận cha (nếu là reply), null nếu comment gốc
}
