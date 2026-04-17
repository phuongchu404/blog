package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "post_meta", uniqueConstraints = {
        @UniqueConstraint(name = "uq_post_meta", columnNames = { "post_id" })
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostMeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false, referencedColumnName = "id", unique = true)
    private Post post;

    @Column(name = "meta_title", length = 100)
    private String metaTitle;

    @Column(name = "meta_description", columnDefinition = "TEXT")
    private String metaDescription;

    @Column(name = "meta_keywords", columnDefinition = "TEXT")
    private String metaKeywords;
}