package me.phuongcm.blog.service;

import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.entity.UploadTracker;
import me.phuongcm.blog.entity.UploadTrackerStatus;
import me.phuongcm.blog.repository.UploadTrackerRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
public class OrphanedFileCleanupTask {

    private final UploadTrackerRepository uploadTrackerRepository;
    private final MinIOService minIOService;

    public OrphanedFileCleanupTask(UploadTrackerRepository uploadTrackerRepository, MinIOService minIOService) {
        this.uploadTrackerRepository = uploadTrackerRepository;
        this.minIOService = minIOService;
    }

    /**
     * Chạy định kỳ mỗi đêm lúc 2:00 AM
     * Xóa các file rác (trạng thái PENDING, tải lên quá 24h)
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOrphanedFiles() {
        log.info("Starting orphaned file cleanup task...");
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        List<UploadTracker> pendingFiles = uploadTrackerRepository.findByStatusAndCreatedAtBefore(UploadTrackerStatus.PENDING, threshold);

        if (pendingFiles.isEmpty()) {
            log.info("No orphaned files found to clean up.");
            return;
        }

        int deletedCount = 0;
        MinIOService.DownloadOption downloadOption = MinIOService.DownloadOption.builder()
                .isPublic(true)
                .build();

        for (UploadTracker tracker : pendingFiles) {
            try {
                // Xóa trên MinIO
                boolean removed = minIOService.removeFile(tracker.getObjectName(), "blog/posts", downloadOption);
                if (removed) {
                    // Xóa DB
                    uploadTrackerRepository.delete(tracker);
                    deletedCount++;
                    log.debug("Deleted orphaned file: {}", tracker.getObjectName());
                } else {
                    log.error("MinIO returned false when deleting file: {}", tracker.getObjectName());
                }
            } catch (Exception e) {
                log.error("Failed to delete orphaned file from MinIO: {}", tracker.getObjectName(), e);
            }
        }

        log.info("Finished orphaned file cleanup task. Deleted {} files.", deletedCount);
    }
}
