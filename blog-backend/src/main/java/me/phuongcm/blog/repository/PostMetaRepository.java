package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Post;
import me.phuongcm.blog.entity.PostMeta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface PostMetaRepository extends JpaRepository<PostMeta, Long> {
    List<PostMeta> findByPostId(Long postId);

    Optional<PostMeta> findByPostIdAndKey(Long postId, String key);

    void deleteByPostIdAndKey(Long postId, String key);

}
