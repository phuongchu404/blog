package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.Series;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeriesRepository extends JpaRepository<Series, Long> {

    List<Series> findByPublishedTrueOrderByCreatedAtDesc();

    Optional<Series> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
