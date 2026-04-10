package me.phuongcm.blog.controller;

import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.entity.Notification;
import me.phuongcm.blog.repository.NotificationRepository;
import me.phuongcm.blog.security.SecurityUtil;
import me.phuongcm.blog.security.service.CustomUserDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    /** GET /api/notifications?page=0&size=20 — Lấy thông báo của user hiện tại */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<Notification>> getMyNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = currentUserId();
        Page<Notification> result = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(result);
    }

    /** GET /api/notifications/unread-count — Số thông báo chưa đọc */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = notificationRepository.countByRecipientIdAndReadFalse(currentUserId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /** PUT /api/notifications/{id}/read — Đánh dấu 1 thông báo đã đọc */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        Long userId = currentUserId();
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getRecipientId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu đã đọc", null));
    }

    /** PUT /api/notifications/read-all — Đánh dấu tất cả đã đọc */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationRepository.markAllReadByRecipientId(currentUserId());
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu tất cả đã đọc", null));
    }

    private Long currentUserId() {
        return SecurityUtil.getCurrentUser()
                .map(CustomUserDetails::getId)
                .orElseThrow(() -> new RuntimeException("Chưa đăng nhập"));
    }
}
