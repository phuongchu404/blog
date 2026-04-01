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
    private Long authorId; // Post Author ID
    private String commenterName;
    private String content;
    private String postTitle;
}
