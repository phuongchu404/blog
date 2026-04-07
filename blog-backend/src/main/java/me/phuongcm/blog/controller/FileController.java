package me.phuongcm.blog.controller;

import me.phuongcm.blog.service.MinIOService;
import me.phuongcm.blog.service.UploadTrackerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final MinIOService minIOService;
    private final UploadTrackerService uploadTrackerService;

    public FileController(MinIOService minIOService, UploadTrackerService uploadTrackerService) {
        this.minIOService = minIOService;
        this.uploadTrackerService = uploadTrackerService;
    }

    /**
     * POST /api/files/upload — Tải ảnh lên phục vụ Rich Text Editor (CKEditor 5) sử dụng MinIO.
     * Phản hồi JSON định dạng { "url": "..." } để CKEditor nhận diện.
     */
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("upload") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "File is empty"));
            }

            // Kiểm tra extension hợp lệ
            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            }

            if (!extension.matches("\\.(jpg|jpeg|png|gif|webp)$")) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Unsupported file type: " + extension));
            }

            // Cấu hình Upload: sử dụng Public Bucket
            MinIOService.UploadOption uploadOption = MinIOService.UploadOption.builder()
                    .isPublic(true)
                    .build();

            // Thực hiện upload vào thư mục blog/posts
            String uploadedFileName = minIOService.uploadFile(
                    file.getInputStream(),
                    file.getOriginalFilename(),
                    "blog/posts",
                    uploadOption,
                    true
            );

            if (uploadedFileName == null) {
                return ResponseEntity.status(500).body(Collections.singletonMap("error", "Upload to MinIO failed"));
            }

            // Lấy URL công khai
            MinIOService.DownloadOption downloadOption = MinIOService.DownloadOption.builder()
                    .isPublic(true)
                    .build();

            String fileUrl = minIOService.getFileUrl(uploadedFileName, "blog/posts", downloadOption);

            // Ghi nhận Tracker
            uploadTrackerService.trackUpload(uploadedFileName, fileUrl);

            return ResponseEntity.ok(Collections.singletonMap("url", fileUrl));
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}
