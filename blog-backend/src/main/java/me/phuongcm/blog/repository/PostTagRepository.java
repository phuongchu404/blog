package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostTagRepository extends JpaRepository<PostTag, Long> {
    List<PostTag> findByPostId(Long postId);

    List<PostTag> findByTagId(Long tagId);

    void deleteByPostIdAndTagId(Long postId, Long tagId);

    @Query(value = "SELECT pt FROM PostTag pt WHERE pt.post.id = :postId")
    List<PostTag> findTagsByPostId(@Param("postId") Long postId);
}
