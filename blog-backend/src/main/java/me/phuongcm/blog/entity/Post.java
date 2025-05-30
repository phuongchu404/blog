package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "post")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name ="parent_id")
    private Post parent;

    @Column(name = "title", length = 75, nullable = false)
    private String title;

    @Column(name = "meta_title", length = 100)
    private String metaTitle;

    @Column(name = "slug", length = 100, nullable = false)
    private String slug;

    @Column(name = "summary")
    private String summary;

    @Column(name = "published")
    private Integer published;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

}
