package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByAuthorId(Long id);

    @Query("SELECT p FROM Post p WHERE p.status = :status")
    List<Post> findByStatus(@Param("status") Integer status);

    @Query("SELECT p FROM Post p WHERE p.status = :status")
    Page<Post> findByStatus(@Param("status") Integer status, Pageable pageable);

    @Query(value = "SELECT p FROM Post p WHERE p.title LIKE %:keyword% OR p.content LIKE %:keyword%")
    List<Post> searchByKeyword(String keyword);

    Optional<Post> findBySlug(String slug);

    @Query("SELECT p FROM Post p JOIN p.postCategories pc JOIN pc.category c WHERE c.slug = :categorySlug AND p.status = 1")
    List<Post> findPublishedByCategorySlug(@Param("categorySlug") String categorySlug);

    @Query("SELECT p FROM Post p JOIN p.postTags pt JOIN pt.tag t WHERE t.slug = :tagSlug AND p.status = 1")
    List<Post> findPublishedByTagSlug(@Param("tagSlug") String tagSlug);

    @Query("SELECT p FROM Post p WHERE p.author.id = :authorId AND p.status = 1")
    List<Post> findPublishedByAuthorId(@Param("authorId") Long authorId);
}
