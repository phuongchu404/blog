package me.phuongcm.blog.controller;

import lombok.RequiredArgsConstructor;
import me.phuongcm.blog.dto.ApiResponse;
import me.phuongcm.blog.entity.Notification;
import me.phuongcm.blog.repository.NotificationRepository;
import me.phuongcm.blog.security.SecurityUtil;
import me.phuongcm.blog.security.service.CustomUserDetails;
import me.phuongcm.blog.service.NotificationStreamService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final NotificationStreamService notificationStreamService;

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

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("isAuthenticated()")
    public SseEmitter streamMyNotifications() {
        return notificationStreamService.subscribe(currentUserId());
    }

    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        long count = notificationRepository.countByRecipientIdAndReadFalse(currentUserId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        Long userId = currentUserId();
        notificationRepository.findById(id).ifPresent(notification -> {
            if (notification.getRecipientId().equals(userId)) {
                notification.setRead(true);
                notificationRepository.save(notification);
                notificationStreamService.publishUnreadCount(userId);
            }
        });
        return ResponseEntity.ok(ApiResponse.ok("Da danh dau da doc", null));
    }

    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        Long userId = currentUserId();
        notificationRepository.markAllReadByRecipientId(userId);
        notificationStreamService.publishUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.ok("Da danh dau tat ca da doc", null));
    }

    private Long currentUserId() {
        return SecurityUtil.getCurrentUser()
                .map(CustomUserDetails::getId)
                .orElseThrow(() -> new RuntimeException("Chua dang nhap"));
    }
}
