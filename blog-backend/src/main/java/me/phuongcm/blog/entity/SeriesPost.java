package me.phuongcm.blog.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "series_post",
        uniqueConstraints = @UniqueConstraint(columnNames = {"series_id", "post_id"}))
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SeriesPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id", nullable = false)
    private Series series;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex = 0;
}
