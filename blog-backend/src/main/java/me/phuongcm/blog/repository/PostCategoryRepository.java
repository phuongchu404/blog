package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostCategory;
import me.phuongcm.blog.entity.id.PostCategoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PostCategoryRepository extends JpaRepository<PostCategory, PostCategoryId> {
    List<PostCategory> findByPostId(Long postId);
    List<PostCategory> findByCategoryId(Long categoryId);
    boolean existsByPostIdAndCategoryId(Long postId, Long categoryId);

    @Transactional
    @Modifying
    void deleteByPostIdAndCategoryId(Long postId, Long categoryId);

    @Transactional
    @Modifying
    void deleteByPostId(Long postId);

    @Query(value = "SELECT pc FROM PostCategory pc WHERE pc.post.id = :postId")
    List<PostCategory> findCategoryByPostId(Long postId);
}
