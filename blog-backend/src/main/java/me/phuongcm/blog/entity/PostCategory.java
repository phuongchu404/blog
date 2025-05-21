package me.phuongcm.blog.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import me.phuongcm.blog.entity.id.PostCategoryId;

@Entity
@Table(name = "post_category")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostCategory {

    @EmbeddedId
    private PostCategoryId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("categoryId")
    private Category category;
}
