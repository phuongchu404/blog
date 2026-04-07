# Dọn rác MinIO bằng File Tracker Database

Tôi đã hoàn tất việc áp dụng **Phương án 2 (File Tracker Database)** để quản lý file upload và tự động xóa ảnh rác (khi user upload ảnh nhưng hủy, không bấm Lưu bài viết).

## Những thay đổi đã thực hiện:

### 1. Thêm Entity & Repository
- **[NEW] [UploadTracker](file:///e:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/entity/UploadTracker.java)**: Bảng `upload_trackers` dùng để lưu trữ trạng thái của file.
- **[NEW] [UploadTrackerStatus](file:///e:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/entity/UploadTrackerStatus.java)**: Định nghĩa Enum `PENDING` (chờ) và `USED` (đã sử dụng).
- **[NEW] [UploadTrackerRepository](file:///e:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/repository/UploadTrackerRepository.java)**: Interface truy vấn Database.

### 2. Xử lý logic tại Backend
- **[NEW] [UploadTrackerService](file:///e:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/service/UploadTrackerService.java)**: Tách logic ghi lại File lúc upload, và logic kiểm tra xem các ảnh nào đã được sử dụng.
- **[MODIFY] [FileController](file:///e:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/controller/FileController.java#L69-L70)**: Ngay khi upload ảnh lên MinIO thành công, gọi `uploadTrackerService.trackUpload()` để ghi Database trạng thái `PENDING`.
- **[MODIFY] [PostServiceImpl](file:///e:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/service/impl/PostServiceImpl.java#L145-L160)**: Ngay khi Save bài viết (Create hoặc Update), sẽ gọi hàm dò tìm URL ảnh dư thừa để cấp trạng thái `USED`.

### 3. Tự động dọn rác ngầm (Cron Job)
- **[NEW] [OrphanedFileCleanupTask](file:///e:/PhuongCM/Tutorial/blog/blog-backend/src/main/java/me/phuongcm/blog/service/OrphanedFileCleanupTask.java)**: Được cấu hình Annotation `@Scheduled(cron = "0 0 2 * * ?")`. Spring Boot sẽ tự động thu gom và xóa mọi tệp ở trạng thái `PENDING` bị bỏ quên hơn **24H** vào lúc 2 giờ sáng mỗi ngày.

---

> [!TIP]
> Bạn có thể chạy ứng dụng lên, mọi tính năng đều chạy tự động và minh bạch. Bảng `upload_trackers` sẽ sớm được JPA Hibernate tự động tạo. Hệ thống của bạn giờ đây đã rất chuyên nghiệp!
