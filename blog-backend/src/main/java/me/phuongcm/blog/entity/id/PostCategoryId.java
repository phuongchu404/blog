package me.phuongcm.blog.entity.id;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Embeddable
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PostCategoryId implements Serializable {

    @Column(name = "post_id")
    private Long postId;

    @Column(name = "category_id")
    private Long categoryId;
}
