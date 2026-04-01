package me.phuongcm.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PostEvent {
    public enum EventType {
        CREATED, UPDATED, DELETED
    }

    private Long postId;
    private EventType eventType;
    private String title;
    private String slug;
    private String summary;
    private String content;
    private String authorName;
    private Boolean published;
}
