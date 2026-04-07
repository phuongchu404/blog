package me.phuongcm.blog.repository;

import me.phuongcm.blog.entity.UploadTracker;
import me.phuongcm.blog.entity.UploadTrackerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UploadTrackerRepository extends JpaRepository<UploadTracker, Long> {
    
    List<UploadTracker> findByStatus(UploadTrackerStatus status);

    List<UploadTracker> findByStatusAndCreatedAtBefore(UploadTrackerStatus status, LocalDateTime createdAt);
    
    List<UploadTracker> findByUrlIn(List<String> urls);
}
