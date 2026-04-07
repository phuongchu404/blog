package me.phuongcm.blog.service;

public interface UploadTrackerService {
    void trackUpload(String objectName, String url);
    void markAsUsedFromHtmlContent(String htmlContent);
}
