package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.PostMeta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PostMetaRepository extends JpaRepository<PostMeta, Long> {
    Optional<PostMeta> findByPostId(Long postId);
}