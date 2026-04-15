package me.phuongcm.blog.controller;

import me.phuongcm.blog.annotation.Auditable;
import me.phuongcm.blog.service.MinIOService;
import me.phuongcm.blog.service.UploadTrackerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
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
    @Auditable(action = "UPLOAD", resource = "FILE")
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> upload(
            @RequestParam("upload") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "blog/posts") String folder) {
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

            // Tạo subfolder theo ngày: ddMMyyyy (vd: 15042026)
            String dateFolder = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyyyy"));
            // Cấu trúc: blog/posts/ddMMyyyy, blog/tags/ddMMyyyy, blog/categories/ddMMyyyy
            String fullFolder = folder + "/" + dateFolder;

            // Upload vào folder được chỉ định
            String uploadedFileName = minIOService.uploadFile(
                    file.getInputStream(),
                    file.getOriginalFilename(),
                    fullFolder,
                    uploadOption,
                    true
            );

            if (uploadedFileName == null) {
                return ResponseEntity.status(500).body(Collections.singletonMap("error", "Upload to MinIO failed"));
            }

            // Đường dẫn tương đối lưu vào DB (không chứa domain/bucket)
            // Format: blog/posts/ddMMyyyy/ten_file
            String filePath = fullFolder + "/" + uploadedFileName;

            // URL đầy đủ để hiển thị ngay trên trình duyệt
            String fileUrl = minIOService.getPublicFileUrl(filePath);

            // Ghi nhận Tracker
            uploadTrackerService.trackUpload(uploadedFileName, fileUrl);

            Map<String, Object> response = new HashMap<>();
            response.put("url", fileUrl);   // dùng để preview ảnh ngay lập tức
            response.put("path", filePath); // dùng để lưu vào DB
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Collections.singletonMap("error", e.getMessage()));
        }
    }
}
