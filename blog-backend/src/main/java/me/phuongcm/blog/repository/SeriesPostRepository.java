package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.SeriesPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeriesPostRepository extends JpaRepository<SeriesPost, Long> {

    List<SeriesPost> findBySeriesIdOrderByOrderIndexAsc(Long seriesId);

    void deleteBySeriesId(Long seriesId);

    boolean existsBySeriesIdAndPostId(Long seriesId, Long postId);

    int countBySeriesId(Long seriesId);
}
