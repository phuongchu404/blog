package me.phuongcm.blog.dto;

import me.phuongcm.blog.entity.Notification;

public record NotificationStreamEvent(
        String type,
        long unreadCount,
        Notification notification
) {
}
