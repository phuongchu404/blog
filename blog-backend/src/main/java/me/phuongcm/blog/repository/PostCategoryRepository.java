package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface PostCategoryRepository extends JpaRepository<PostCategory, Long> {
    List<PostCategory> findByPostId(Long postId);
    List<PostCategory> findByCategoryId(Long categoryId);
    void deleteByPostIdAndCategoryId(Long postId, Long categoryId);

    @Query(value = "SELECT pc FROM PostCategory pc WHERE pc.post.id = :postId")
    List<PostCategory> findCategoryByPostId(Long postId);
}
