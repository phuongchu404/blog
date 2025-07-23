package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPostId(Long postId);

    List<PostComment> findByPostIdAndPublishedTrue(Long postId);

    List<PostComment> findByParentId(Long parentId);
}
