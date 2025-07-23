package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByAuthorId(Long id);

    List<Post> findByPublishedTrue();

    @Query(value = "SELECT p FROM Post p WHERE p.title LIKE %:keyword% OR p.content LIKE %:keyword%")
    List<Post> searchByKeyword(String keyword);

    Optional<Post> findBySlug(String slug);
}
