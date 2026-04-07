package me.phuongcm.blog.service.impl;

import me.phuongcm.blog.entity.UploadTracker;
import me.phuongcm.blog.entity.UploadTrackerStatus;
import me.phuongcm.blog.repository.UploadTrackerRepository;
import me.phuongcm.blog.service.UploadTrackerService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UploadTrackerServiceImpl implements UploadTrackerService {

    private final UploadTrackerRepository repository;

    public UploadTrackerServiceImpl(UploadTrackerRepository repository) {
        this.repository = repository;
    }

    @Override
    public void trackUpload(String objectName, String url) {
        UploadTracker tracker = new UploadTracker(objectName, url, UploadTrackerStatus.PENDING);
        repository.save(tracker);
    }

    @Override
    public void markAsUsedFromHtmlContent(String htmlContent) {
        if (htmlContent == null || htmlContent.isEmpty()) {
            return;
        }
        
        List<UploadTracker> pendingTrackers = repository.findByStatus(UploadTrackerStatus.PENDING);
        boolean anyChanged = false;
        
        for (UploadTracker tracker : pendingTrackers) {
            if (htmlContent.contains(tracker.getUrl())) {
                tracker.setStatus(UploadTrackerStatus.USED);
                anyChanged = true;
            }
        }
        
        if (anyChanged) {
            repository.saveAll(pendingTrackers);
        }
    }
}
