package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findBySlug(String slug);

    @Query(value = "SELECT t FROM Tag t WHERE t.title LIKE %:name%")
    List<Tag> findByTitleContaining(@Param("name") String name);
}
