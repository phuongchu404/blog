package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPostId(Long postId);

    List<PostComment> findByPostIdAndPublished(Long postId, Integer published); // 0: Unpublished, 1: Published

    List<PostComment> findByParentId(Long parentId);
}
