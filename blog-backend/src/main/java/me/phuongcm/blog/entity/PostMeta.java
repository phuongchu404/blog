package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "post_meta")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostMeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "key", length = 50, nullable = false)
    private String key;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
}
