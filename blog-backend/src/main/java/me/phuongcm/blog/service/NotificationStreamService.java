package me.phuongcm.blog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.phuongcm.blog.dto.NotificationStreamEvent;
import me.phuongcm.blog.entity.Notification;
import me.phuongcm.blog.repository.NotificationRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationStreamService {

    private static final long SSE_TIMEOUT_MS = 120_000L;
    private static final int MAX_EMITTERS_PER_USER = 2;

    private final NotificationRepository notificationRepository;

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emittersByUser = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        CopyOnWriteArrayList<SseEmitter> emitters =
                emittersByUser.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>());

        while (emitters.size() >= MAX_EMITTERS_PER_USER) {
            SseEmitter staleEmitter = emitters.remove(0);
            completeEmitter(staleEmitter);
            log.info("Closed old notification SSE emitter for userId={} to keep connection count bounded", userId);
        }

        emitters.add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(ex -> removeEmitter(userId, emitter));

        sendInitialSnapshot(userId, emitter);
        return emitter;
    }

    public void publishNotification(Notification notification) {
        long unreadCount = notificationRepository.countByRecipientIdAndReadFalse(notification.getRecipientId());
        sendEvent(notification.getRecipientId(), new NotificationStreamEvent(
                "NEW_NOTIFICATION",
                unreadCount,
                notification
        ));
    }

    public void publishUnreadCount(Long userId) {
        long unreadCount = notificationRepository.countByRecipientIdAndReadFalse(userId);
        sendEvent(userId, new NotificationStreamEvent("SYNC", unreadCount, null));
    }

    @Scheduled(fixedDelay = 25000)
    public void heartbeat() {
        emittersByUser.forEach((userId, emitters) -> {
            for (SseEmitter emitter : List.copyOf(emitters)) {
                try {
                    emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
                } catch (Exception ex) {
                    cleanupBrokenEmitter(userId, emitter, ex);
                }
            }
        });
    }

    private void sendInitialSnapshot(Long userId, SseEmitter emitter) {
        long unreadCount = notificationRepository.countByRecipientIdAndReadFalse(userId);
        try {
            emitter.send(SseEmitter.event().name("notification").data(
                    new NotificationStreamEvent("INIT", unreadCount, null)
            ));
        } catch (Exception ex) {
            cleanupBrokenEmitter(userId, emitter, ex);
            throw new IllegalStateException("Cannot initialize notification SSE stream", ex);
        }
    }

    private void sendEvent(Long userId, NotificationStreamEvent payload) {
        List<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : List.copyOf(emitters)) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(payload));
            } catch (Exception ex) {
                cleanupBrokenEmitter(userId, emitter, ex);
            }
        }
    }

    private void cleanupBrokenEmitter(Long userId, SseEmitter emitter, Exception ex) {
        removeEmitter(userId, emitter);
        completeEmitter(emitter);
        log.debug("Closed stale notification SSE emitter for userId={}: {}", userId, ex.getMessage());
    }

    private void completeEmitter(SseEmitter emitter) {
        try {
            emitter.complete();
        } catch (Exception ignored) {
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = emittersByUser.get(userId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByUser.remove(userId);
        }
    }
}
